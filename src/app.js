import { createApiKeyAuth } from './auth/api-key-auth.js';
import { buildExpiredSessionCookie, buildSessionCookie, createSessionAuth, createSessionStore } from './auth/session-auth.js';
import { createContentService } from './content/service.js';
import { getErrorDetails, getErrorDiagnostic, serializeErrorForLog } from './errors.js';
import { badRequest, binary, errorResponse, forbidden, gone, json, methodNotAllowed, notFound, readJson } from './http/json.js';
import { PocketBaseClient } from './pocketbase/client.js';
import { renderCredentialPage, renderErrorPage, renderLoginPage, renderOwnerDetailPage, renderOwnerListPage, renderOwnerSearchPage, renderPublicContentPage, renderPublicListPage, renderPublicSearchPage } from './web/page-renderer.js';

function routeGroup(pathname) {
  if (pathname === '/api/health') return 'health';
  if (pathname === '/web/auth/login') return 'owner-auth-page';
  if (pathname === '/web/auth/logout') return 'owner-auth-action';
  if (pathname === '/web/credential') return 'owner-page';
  if (pathname === '/web/list') return 'owner-page';
  if (pathname === '/web/search') return 'owner-page';
  if (pathname.startsWith('/web/detail/')) return 'owner-page';
  if (pathname.startsWith('/web/action/')) return 'owner-page-action';
  if (pathname === '/web/public/list') return 'public-page';
  if (pathname === '/web/public/search') return 'public-page';
  if (pathname.startsWith('/web/public/content/')) return 'public-page';
  if (pathname.startsWith('/web/public/share/')) return 'public-page';
  if (pathname.startsWith('/api/write/')) return 'write';
  if (pathname.startsWith('/api/query/')) return 'query';
  if (pathname.startsWith('/api/public/')) return 'public';
  return null;
}

function html(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8'
  });
  response.end(body);
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, {
    location,
    ...headers
  });
  response.end('');
}

function encodeContentDispositionFileName(filename) {
  return encodeURIComponent(filename).replaceAll(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function sendPublicContent(response, result) {
  if (result.type !== 'file') {
    json(response, 200, result);
    return;
  }

  const filename = result.download.filename || 'download.bin';
  binary(response, 200, result.fileContent, {
    'content-type': result.download.mimeType || 'application/octet-stream',
    'content-length': String(result.fileContent.byteLength),
    'content-disposition': `attachment; filename*=UTF-8''${encodeContentDispositionFileName(filename)}`,
    'x-content-type-options': 'nosniff'
  });
}

function logRequestError(error, request, extra = {}) {
  const context = {
    method: request.method,
    url: request.url,
    ...extra
  };

  console.error(JSON.stringify(serializeErrorForLog(error, context)));
}

function respondApiError(response, request, error, fallbackMessage) {
  if (error.statusCode === 400) {
    badRequest(response, error.message, error.code);
    return;
  }

  if (error.statusCode === 403) {
    forbidden(response, error.message);
    return;
  }

  if (error.statusCode === 404) {
    errorResponse(response, 404, 'not_found', error.message, error.code, getErrorDiagnostic(error));
    return;
  }

  if (error.statusCode === 410) {
    gone(response, error.message);
    return;
  }

  logRequestError(error, request);
  errorResponse(response, error.statusCode ?? 500, error.code ?? 'internal_error', fallbackMessage, getErrorDetails(error), getErrorDiagnostic(error));
}

function shouldLogPageError(error) {
  return !error?.statusCode || error.statusCode >= 500;
}

function buildFlashFromParams(searchParams) {
  const message = searchParams.get('message');
  if (!message) {
    return null;
  }

  const tone = searchParams.get('tone') ?? 'success';
  const title = searchParams.get('title') ?? (tone === 'error' ? '操作失败' : '操作已完成');
  return {
    tone,
    title,
    message
  };
}

function buildRedirectUrl(pathname, flash) {
  const nextUrl = new URL(`http://127.0.0.1${pathname}`);
  if (flash?.message) {
    nextUrl.searchParams.set('tone', flash.tone ?? 'success');
    nextUrl.searchParams.set('title', flash.title ?? '操作已完成');
    nextUrl.searchParams.set('message', flash.message);
  }
  return `${nextUrl.pathname}${nextUrl.search}`;
}

function appendOwnerListState(nextUrl, form) {
  const missingLocalFileOnly = form.get('missingLocalFileOnly');
  if (missingLocalFileOnly === '1') {
    nextUrl.searchParams.set('missingLocalFileOnly', '1');
  }

  const page = form.get('page');
  if (typeof page === 'string' && page.trim()) {
    nextUrl.searchParams.set('page', page.trim());
  }

  const query = form.get('query');
  if (typeof query === 'string' && query.trim()) {
    nextUrl.searchParams.set('q', query.trim());
  }
}

async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return new URLSearchParams(raw);
}

export function createApp(config, dependencies = {}) {
  const pocketbaseClient = dependencies.pocketbaseClient ?? new PocketBaseClient({
    baseUrl: config.pocketbaseBaseUrl,
    adminEmail: config.pocketbaseAdminEmail,
    adminPassword: config.pocketbaseAdminPassword,
    fetchImpl: dependencies.fetchImpl
  });
  const apiKeyAuth = createApiKeyAuth({
    apiKeyHeader: config.apiKeyHeader,
    pocketbaseClient
  });
  const optionalApiKeyAuth = createApiKeyAuth({
    apiKeyHeader: config.apiKeyHeader,
    pocketbaseClient,
    allowMissing: true
  });
  const sessionStore = dependencies.sessionStore ?? createSessionStore();
  const sessionAuth = createSessionAuth({
    cookieName: config.ownerSessionCookieName,
    sessionStore
  });
  const contentService = dependencies.contentService ?? createContentService({
    config,
    pocketbaseClient,
    fsImpl: dependencies.fsImpl,
    markdownRenderer: dependencies.markdownRenderer
  });

  return async function app(request, response) {
    const url = new URL(request.url, `http://${request.headers.host ?? '127.0.0.1'}`);
    const group = routeGroup(url.pathname);

    if (!group) {
      notFound(response);
      return;
    }

    if (group === 'health') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        const health = await pocketbaseClient.healthCheck();
        json(response, 200, {
          service: 'business-shell',
          status: 'ok',
          pocketbase: health,
          routeGroups: {
            write: '/api/write/*',
            query: '/api/query/*',
            public: '/api/public/*',
            publicPages: '/web/public/*',
            ownerActions: '/web/action/*',
            ownerBatch: '/web/action/batch',
            ownerAuth: '/web/auth/login',
            ownerCredential: '/web/credential'
          }
        });
      } catch (error) {
        json(response, 502, {
          service: 'business-shell',
          status: 'degraded',
          error: 'pocketbase_unavailable',
          details: getErrorDetails(error),
          ...(getErrorDiagnostic(error) ? { diagnostic: getErrorDiagnostic(error) } : {})
        });
      }
      return;
    }

    if (group === 'public') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        if (url.pathname.startsWith('/api/public/content/')) {
          const contentHash = url.pathname.slice('/api/public/content/'.length);
          const result = await contentService.getPublicContentByHash(contentHash);
          sendPublicContent(response, result);
          return;
        }

        if (url.pathname.startsWith('/api/public/share/')) {
          const shareHash = url.pathname.slice('/api/public/share/'.length);
          const result = await contentService.getPublicContentByShareHash(shareHash);
          sendPublicContent(response, result);
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        respondApiError(response, request, error, 'Public content access failed.');
        return;
      }
    }

    if (group === 'owner-auth-page') {
      if (request.method === 'GET') {
        const existingSession = await sessionAuth(request);
        if (existingSession) {
          redirect(response, '/web/list');
          return;
        }

        html(response, 200, renderLoginPage({
          apiKeyHeader: config.apiKeyHeader,
          flash: buildFlashFromParams(url.searchParams)
        }));
        return;
      }

      if (request.method === 'POST') {
        const form = await readForm(request);
        const formApiKey = form.get(config.apiKeyHeader);
        const authRequest = {
          ...request,
          headers: {
            ...request.headers,
            [config.apiKeyHeader]: typeof formApiKey === 'string' ? formApiKey.trim() : formApiKey
          }
        };
        const authContext = await optionalApiKeyAuth(authRequest, response);
        if (!authContext) {
          redirect(response, buildRedirectUrl('/web/auth/login', {
            tone: 'error',
            title: '登录失败',
            message: 'API Key 无效，无法进入 owner 控制台。'
          }));
          return;
        }

        const token = sessionStore.createSession({
          user: authContext.user,
          apiKey: authContext.apiKey,
          maxAgeMs: config.ownerSessionMaxAgeSeconds * 1000
        });

        redirect(response, buildRedirectUrl('/web/list', {
          tone: 'success',
          title: '登录成功',
          message: '已进入 owner 控制台。'
        }), {
          'set-cookie': buildSessionCookie({
            cookieName: config.ownerSessionCookieName,
            token,
            maxAgeSeconds: config.ownerSessionMaxAgeSeconds
          })
        });
        return;
      }

      methodNotAllowed(response);
      return;
    }

    if (group === 'owner-auth-action') {
      if (request.method !== 'POST') {
        methodNotAllowed(response);
        return;
      }

      const sessionContext = await sessionAuth(request);
      if (sessionContext?.sessionToken) {
        sessionStore.deleteSession(sessionContext.sessionToken);
      }

      redirect(response, buildRedirectUrl('/web/auth/login', {
        tone: 'info',
        title: '已退出',
        message: 'owner 会话已结束。'
      }), {
        'set-cookie': buildExpiredSessionCookie(config.ownerSessionCookieName)
      });
      return;
    }

    if (group === 'public-page') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        if (url.pathname === '/web/public/list') {
          const result = await contentService.listPublicContents({
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage')
          });
          html(response, 200, renderPublicListPage(result));
          return;
        }

        if (url.pathname === '/web/public/search') {
          const result = await contentService.searchPublicContents({
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage')
          });
          html(response, 200, renderPublicSearchPage(result));
          return;
        }

        if (url.pathname.startsWith('/web/public/content/')) {
          const contentHash = url.pathname.slice('/web/public/content/'.length);
          const result = await contentService.getPublicContentByHash(contentHash);
          html(response, 200, renderPublicContentPage(result));
          return;
        }

        if (url.pathname.startsWith('/web/public/share/')) {
          const shareHash = url.pathname.slice('/web/public/share/'.length);
          const result = await contentService.getPublicContentByShareHash(shareHash);
          html(response, 200, renderPublicContentPage(result));
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        if (shouldLogPageError(error)) {
          logRequestError(error, request, { routeGroup: 'public-page' });
        }
        if (error.statusCode === 400) {
          const page = renderErrorPage({ title: '访问参数错误', message: error.message, statusCode: 400 });
          html(response, page.statusCode, page.html);
          return;
        }

        if (error.statusCode === 403) {
          const page = renderErrorPage({ title: '内容不可公开访问', message: error.message, statusCode: 403 });
          html(response, page.statusCode, page.html);
          return;
        }

        if (error.statusCode === 404) {
          const page = renderErrorPage({ title: '内容不存在', message: error.message, statusCode: 404 });
          html(response, page.statusCode, page.html);
          return;
        }

        if (error.statusCode === 410) {
          const page = renderErrorPage({ title: '分享已失效', message: error.message, statusCode: 410 });
          html(response, page.statusCode, page.html);
          return;
        }

        const page = renderErrorPage({ title: '公开访问失败', message: error.message, statusCode: 500 });
        html(response, page.statusCode, page.html);
        return;
      }
    }

    let authContext = null;
    if (group === 'owner-page' || group === 'owner-page-action') {
      authContext = await sessionAuth(request);
      if (!authContext) {
        authContext = await optionalApiKeyAuth(request, response);
      }

      if (!authContext) {
        redirect(response, buildRedirectUrl('/web/auth/login', {
          tone: 'info',
          title: '请先登录',
          message: '请输入有效 API Key 进入 owner 控制台。'
        }));
        return;
      }
    } else {
      authContext = await apiKeyAuth(request, response);
      if (!authContext) {
        return;
      }
    }

    if (group === 'owner-page') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        if (url.pathname === '/web/credential') {
          html(response, 200, renderCredentialPage({
            user: authContext.user,
            apiKeyHeader: config.apiKeyHeader,
            cookieName: config.ownerSessionCookieName,
            flash: buildFlashFromParams(url.searchParams)
          }));
          return;
        }

        if (url.pathname === '/web/list') {
          const result = await contentService.listContents({
            ownerUserId: authContext.user.id,
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage'),
            missingLocalFileOnly: url.searchParams.get('missingLocalFileOnly')
          });

          result.flash = buildFlashFromParams(url.searchParams);
          html(response, 200, renderOwnerListPage(result));
          return;
        }

        if (url.pathname === '/web/search') {
          const result = await contentService.searchContents({
            ownerUserId: authContext.user.id,
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage'),
            missingLocalFileOnly: url.searchParams.get('missingLocalFileOnly')
          });

          result.flash = buildFlashFromParams(url.searchParams);
          html(response, 200, renderOwnerSearchPage(result));
          return;
        }

        if (url.pathname.startsWith('/web/detail/')) {
          const contentId = url.pathname.slice('/web/detail/'.length);
          const result = await contentService.getContentDetail({
            ownerUserId: authContext.user.id,
            contentId
          });

          result.flash = buildFlashFromParams(url.searchParams);
          html(response, 200, renderOwnerDetailPage(result));
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        if (shouldLogPageError(error)) {
          logRequestError(error, request, { routeGroup: 'owner-page' });
        }
        if (error.statusCode === 400) {
          const page = renderErrorPage({ title: '请求参数错误', message: error.message, statusCode: 400 });
          html(response, page.statusCode, page.html);
          return;
        }

        if (error.statusCode === 403) {
          const page = renderErrorPage({ title: '无权访问该内容', message: error.message, statusCode: 403 });
          html(response, page.statusCode, page.html);
          return;
        }

        if (error.statusCode === 404) {
          const page = renderErrorPage({ title: '内容不存在', message: error.message, statusCode: 404 });
          html(response, page.statusCode, page.html);
          return;
        }

        const page = renderErrorPage({ title: '页面加载失败', message: error.message, statusCode: 500 });
        html(response, page.statusCode, page.html);
        return;
      }
    }

    if (group === 'owner-page-action') {
      if (request.method !== 'POST') {
        methodNotAllowed(response);
        return;
      }

      let actionContentId = '';

      try {
        const form = await readForm(request);

        if (url.pathname === '/web/action/batch') {
          const contentIds = form.getAll('contentIds');
          const action = form.get('batchAction');
          const result = await contentService.batchOperateContents({
            ownerUserId: authContext.user.id,
            action,
            contentIds
          });
          const actionLabel = action === 'share'
            ? '批量分享'
            : action === 'share_revoke'
              ? '批量撤销分享'
              : action === 'cleanup_missing_file_records'
                ? '清理'
                : '批量删除';
          const redirectUrl = new URL(`http://127.0.0.1/web/list`);
          appendOwnerListState(redirectUrl, form);
          redirect(response, buildRedirectUrl(`${redirectUrl.pathname}${redirectUrl.search}`, {
            tone: 'success',
            title: action === 'cleanup_missing_file_records' ? '清理已完成' : actionLabel + '已完成',
            message: action === 'cleanup_missing_file_records'
              ? '已清理 ' + result.succeededCount + ' 条缺失本地文件记录。'
              : '已完成 ' + result.succeededCount + ' 条内容的' + actionLabel + '。'
          }));
          return;
        }

        const contentId = form.get('contentId');
        if (typeof contentId !== 'string' || !contentId.trim()) {
          const error = new Error('contentId is required.');
          error.statusCode = 400;
          throw error;
        }

        actionContentId = contentId.trim();

        if (url.pathname === '/web/action/share') {
          await contentService.createShareLink({
            ownerUserId: authContext.user.id,
            contentId: actionContentId
          });
          redirect(response, buildRedirectUrl(`/web/detail/${encodeURIComponent(actionContentId)}`, {
            tone: 'success',
            title: '分享已创建',
            message: '该内容已开放公开访问。'
          }));
          return;
        }

        if (url.pathname === '/web/action/share/revoke') {
          await contentService.revokeShareLink({
            ownerUserId: authContext.user.id,
            contentId: actionContentId
          });
          redirect(response, buildRedirectUrl(`/web/detail/${encodeURIComponent(actionContentId)}`, {
            tone: 'success',
            title: '分享已撤销',
            message: '公开访问已关闭。'
          }));
          return;
        }

        if (url.pathname === '/web/action/update') {
          const title = form.get('title');
          const body = form.get('body');
          const bodyFormat = form.get('bodyFormat');
          await contentService.updateContent({
            ownerUserId: authContext.user.id,
            contentId: actionContentId,
            title,
            ...(body !== null ? { body } : {}),
            ...(bodyFormat !== null ? { bodyFormat } : {})
          });
          redirect(response, buildRedirectUrl(`/web/detail/${encodeURIComponent(actionContentId)}`, {
            tone: 'success',
            title: '内容已更新',
            message: '内容更新已保存。'
          }));
          return;
        }

        if (url.pathname === '/web/action/delete') {
          await contentService.deleteContent({
            ownerUserId: authContext.user.id,
            contentId: actionContentId
          });
          redirect(response, buildRedirectUrl('/web/list', {
            tone: 'success',
            title: '内容已删除',
            message: `内容 ${actionContentId} 已被删除。`
          }));
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        if (shouldLogPageError(error)) {
          logRequestError(error, request, { routeGroup: 'owner-page-action' });
        }

        const redirectTarget = actionContentId
          ? `/web/detail/${encodeURIComponent(actionContentId)}`
          : '/web/list';

        redirect(response, buildRedirectUrl(redirectTarget, {
          tone: 'error',
          title: '操作失败',
          message: error.message || 'Owner 页面操作失败。'
        }));
        return;
      }
    }

    if (group === 'write') {
      if (request.method !== 'POST') {
        methodNotAllowed(response);
        return;
      }

      try {
        const body = await readJson(request);

        if (url.pathname === '/api/write/html') {
          const result = await contentService.createHtmlContent({
            ownerUserId: authContext.user.id,
            title: body.title,
            htmlContent: body.htmlContent
          });

          json(response, 201, result);
          return;
        }

        if (url.pathname === '/api/write/content') {
          const result = await contentService.createHtmlContent({
            ownerUserId: authContext.user.id,
            title: body.title,
            body: body.body,
            bodyFormat: body.bodyFormat,
            htmlContent: body.htmlContent,
            authorName: body.authorName,
            createdAt: body.createdAt
          });

          json(response, 201, result);
          return;
        }

        if (url.pathname === '/api/write/file') {
          const result = await contentService.createFileContent({
            ownerUserId: authContext.user.id,
            title: body.title,
            filename: body.filename,
            mimeType: body.mimeType,
            contentBase64: body.contentBase64
          });

          json(response, 201, result);
          return;
        }

        if (url.pathname === '/api/write/share') {
          const result = await contentService.createShareLink({
            ownerUserId: authContext.user.id,
            contentId: body.contentId
          });

          json(response, 201, result);
          return;
        }

        if (url.pathname === '/api/write/share/revoke') {
          const result = await contentService.revokeShareLink({
            ownerUserId: authContext.user.id,
            contentId: body.contentId
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname === '/api/write/update') {
          const result = await contentService.updateContent({
            ownerUserId: authContext.user.id,
            contentId: body.contentId,
            title: body.title,
            ...(Object.prototype.hasOwnProperty.call(body, 'htmlContent') ? { htmlContent: body.htmlContent } : {}),
            ...(Object.prototype.hasOwnProperty.call(body, 'body') ? { body: body.body } : {}),
            ...(Object.prototype.hasOwnProperty.call(body, 'bodyFormat') ? { bodyFormat: body.bodyFormat } : {})
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname === '/api/write/batch') {
          const result = await contentService.batchOperateContents({
            ownerUserId: authContext.user.id,
            action: body.action,
            contentIds: body.contentIds
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname === '/api/write/delete') {
          const result = await contentService.deleteContent({
            ownerUserId: authContext.user.id,
            contentId: body.contentId
          });

          json(response, 200, result);
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        respondApiError(response, request, error, 'Content write failed.');
        return;
      }
    }

    if (group === 'query') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        if (url.pathname === '/api/query/list') {
          const result = await contentService.listContents({
            ownerUserId: authContext.user.id,
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage'),
            missingLocalFileOnly: url.searchParams.get('missingLocalFileOnly')
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname === '/api/query/search') {
          const result = await contentService.searchContents({
            ownerUserId: authContext.user.id,
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage'),
            missingLocalFileOnly: url.searchParams.get('missingLocalFileOnly')
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname.startsWith('/api/query/detail/')) {
          const contentId = url.pathname.slice('/api/query/detail/'.length);
          const result = await contentService.getContentDetail({
            ownerUserId: authContext.user.id,
            contentId
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname.startsWith('/api/query/content/')) {
          const contentId = url.pathname.slice('/api/query/content/'.length);
          const result = await contentService.getContentDetail({
            ownerUserId: authContext.user.id,
            contentId
          });

          json(response, 200, result);
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        respondApiError(response, request, error, 'Content query failed.');
        return;
      }
    }

    json(response, 200, {
      routeGroup: group,
      status: 'placeholder',
      message: group === 'write'
        ? 'Write APIs will be implemented in T4.'
        : 'Query APIs will be implemented in T6.',
      auth: {
        userId: authContext.user.id,
        displayName: authContext.user.displayName
      }
    });
  };
}
