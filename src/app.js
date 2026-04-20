import { createApiKeyAuth } from './auth/api-key-auth.js';
import { createContentService } from './content/service.js';
import { getErrorDetails, getErrorDiagnostic, serializeErrorForLog } from './errors.js';
import { badRequest, binary, errorResponse, forbidden, gone, json, methodNotAllowed, notFound, readJson } from './http/json.js';
import { PocketBaseClient } from './pocketbase/client.js';
import { renderErrorPage, renderOwnerDetailPage, renderOwnerListPage, renderOwnerSearchPage, renderPublicContentPage, renderPublicListPage, renderPublicSearchPage } from './web/page-renderer.js';

function routeGroup(pathname) {
  if (pathname === '/api/health') return 'health';
  if (pathname === '/web/list') return 'owner-page';
  if (pathname === '/web/search') return 'owner-page';
  if (pathname.startsWith('/web/detail/')) return 'owner-page';
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
  const contentService = dependencies.contentService ?? createContentService({
    config,
    pocketbaseClient,
    fsImpl: dependencies.fsImpl
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
            publicPages: '/web/public/*'
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

    const authContext = await apiKeyAuth(request, response);
    if (!authContext) {
      return;
    }

    if (group === 'owner-page') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
        if (url.pathname === '/web/list') {
          const result = await contentService.listContents({
            ownerUserId: authContext.user.id,
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage')
          });

          html(response, 200, renderOwnerListPage(result));
          return;
        }

        if (url.pathname === '/web/search') {
          const result = await contentService.searchContents({
            ownerUserId: authContext.user.id,
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage')
          });

          html(response, 200, renderOwnerSearchPage(result));
          return;
        }

        if (url.pathname.startsWith('/web/detail/')) {
          const contentId = url.pathname.slice('/web/detail/'.length);
          const result = await contentService.getContentDetail({
            ownerUserId: authContext.user.id,
            contentId
          });

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
            perPage: url.searchParams.get('perPage')
          });

          json(response, 200, result);
          return;
        }

        if (url.pathname === '/api/query/search') {
          const result = await contentService.searchContents({
            ownerUserId: authContext.user.id,
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
            perPage: url.searchParams.get('perPage')
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
