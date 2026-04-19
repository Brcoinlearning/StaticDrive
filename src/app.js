import { createApiKeyAuth } from './auth/api-key-auth.js';
import { createContentService } from './content/service.js';
import { badRequest, forbidden, gone, json, methodNotAllowed, notFound, readJson, serverError } from './http/json.js';
import { PocketBaseClient } from './pocketbase/client.js';
import { renderErrorPage, renderOwnerDetailPage, renderOwnerListPage, renderOwnerSearchPage, renderPublicContentPage } from './web/page-renderer.js';

function routeGroup(pathname) {
  if (pathname === '/api/health') return 'health';
  if (pathname === '/web/list') return 'owner-page';
  if (pathname === '/web/search') return 'owner-page';
  if (pathname.startsWith('/web/detail/')) return 'owner-page';
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
            public: '/api/public/*'
          }
        });
      } catch (error) {
        json(response, 502, {
          service: 'business-shell',
          status: 'degraded',
          error: 'pocketbase_unavailable',
          details: error.message
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
          json(response, 200, result);
          return;
        }

        if (url.pathname.startsWith('/api/public/share/')) {
          const shareHash = url.pathname.slice('/api/public/share/'.length);
          const result = await contentService.getPublicContentByShareHash(shareHash);
          json(response, 200, result);
          return;
        }

        notFound(response);
        return;
      } catch (error) {
        if (error.statusCode === 400) {
          badRequest(response, error.message, error.code);
          return;
        }

        if (error.statusCode === 403) {
          forbidden(response, error.message);
          return;
        }

        if (error.statusCode === 404) {
          json(response, 404, {
            error: 'not_found',
            message: error.message,
            details: error.code
          });
          return;
        }

        if (error.statusCode === 410) {
          gone(response, error.message);
          return;
        }

        serverError(response, 'Public content access failed.', error.message);
        return;
      }
    }

    if (group === 'public-page') {
      if (request.method !== 'GET') {
        methodNotAllowed(response);
        return;
      }

      try {
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
        if (error.statusCode === 400) {
          badRequest(response, error.message, error.code);
          return;
        }

        if (error.statusCode === 403) {
          forbidden(response, error.message);
          return;
        }

        if (error.statusCode === 404) {
          json(response, 404, {
            error: 'not_found',
            message: error.message,
            details: error.code
          });
          return;
        }

        serverError(response, 'Content write failed.', error.message);
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
        if (error.statusCode === 400) {
          badRequest(response, error.message, error.code);
          return;
        }

        if (error.statusCode === 403) {
          forbidden(response, error.message);
          return;
        }

        if (error.statusCode === 404) {
          json(response, 404, {
            error: 'not_found',
            message: error.message,
            details: error.code
          });
          return;
        }

        serverError(response, 'Content query failed.', error.message);
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
