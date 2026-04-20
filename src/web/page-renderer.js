function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderLayout({ title, heading, description, body }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3efe7;
        --surface: #fffdf8;
        --surface-alt: #efe5d5;
        --text: #1f2933;
        --muted: #52606d;
        --accent: #9f4f2f;
        --accent-soft: #f6e0d5;
        --border: #d9cbb8;
        --shadow: 0 18px 40px rgba(93, 64, 45, 0.12);
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(159, 79, 47, 0.10), transparent 28%),
          linear-gradient(180deg, #fbf7f0 0%, var(--bg) 100%);
      }

      .page {
        max-width: 980px;
        margin: 0 auto;
        padding: 32px 18px 64px;
      }

      .hero {
        margin-bottom: 24px;
        padding: 28px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: linear-gradient(145deg, rgba(255, 253, 248, 0.96), rgba(239, 229, 213, 0.86));
        box-shadow: var(--shadow);
      }

      h1, h2, h3 { margin: 0 0 12px; line-height: 1.15; }
      h1 { font-size: clamp(2rem, 5vw, 3.2rem); }
      h2 { font-size: 1.35rem; }
      p, li, label, input, a, span { font-size: 1rem; }
      p { margin: 0 0 12px; color: var(--muted); }
      a { color: var(--accent); }
      form {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 18px 0 0;
      }
      input {
        flex: 1 1 240px;
        min-width: 0;
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.92);
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: white;
        cursor: pointer;
      }
      .grid {
        display: grid;
        gap: 16px;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 18px;
        background: var(--surface);
        box-shadow: 0 10px 24px rgba(93, 64, 45, 0.08);
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        color: var(--muted);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.9rem;
      }
      .empty, .error {
        padding: 18px;
        border-radius: 18px;
        border: 1px dashed var(--border);
        background: rgba(255, 253, 248, 0.7);
      }
      .error {
        background: #fff0eb;
        color: #7c2d12;
      }
      .detail {
        display: grid;
        gap: 20px;
      }
      iframe.preview {
        width: 100%;
        min-height: 420px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: white;
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 16px;
        background: #fffaf2;
        border: 1px solid var(--border);
      }
      @media (max-width: 640px) {
        .page { padding: 20px 14px 40px; }
        .hero { padding: 20px; border-radius: 18px; }
        .card { border-radius: 16px; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1>${escapeHtml(heading)}</h1>
        <p>${escapeHtml(description)}</p>
        <form method="get" action="/web/search">
          <input type="search" name="q" placeholder="按标题或文件名搜索" aria-label="搜索内容">
          <button type="submit">搜索</button>
        </form>
      </section>
      ${body}
    </main>
  </body>
</html>`;
}

function renderItemCard(item) {
  const sharedText = item.isShared ? '已分享' : '未分享';
  const fileName = item.originalFilename ? `<p>文件名：${escapeHtml(item.originalFilename)}</p>` : '';
  return `<article class="card">
    <div class="badge">${escapeHtml(item.type)}</div>
    <h2><a href="/web/detail/${encodeURIComponent(item.contentId)}">${escapeHtml(item.title || item.originalFilename || '未命名内容')}</a></h2>
    ${fileName}
    <div class="meta">
      <span>内容 ID: ${escapeHtml(item.contentId)}</span>
      <span>${escapeHtml(sharedText)}</span>
      <span>${escapeHtml(item.mimeType || '-')}</span>
    </div>
  </article>`;
}

function renderPublicItemCard(item) {
  const fileName = item.originalFilename ? `<p>文件名：${escapeHtml(item.originalFilename)}</p>` : '';
  return `<article class="card">
    <div class="badge">${escapeHtml(item.type === 'rich_text' ? '公开富文本' : '公开文件')}</div>
    <h2><a href="${escapeHtml(item.publicPageUrl)}">${escapeHtml(item.title || item.originalFilename || '未命名内容')}</a></h2>
    ${fileName}
    <div class="meta">
      <span>Hash: ${escapeHtml(item.contentHash)}</span>
      <span>${escapeHtml(item.mimeType || '-')}</span>
      <span>${escapeHtml(item.fileSize || 0)} bytes</span>
    </div>
  </article>`;
}

export function renderOwnerListPage(payload) {
  const cards = payload.items.length > 0
    ? payload.items.map(renderItemCard).join('')
    : '<section class="empty">当前还没有内容。</section>';

  return renderLayout({
    title: '内容列表',
    heading: '内容列表',
    description: `共 ${payload.totalItems} 条内容，当前第 ${payload.page} 页。`,
    body: `<section class="grid">${cards}</section>`
  });
}

export function renderOwnerSearchPage(payload) {
  const cards = payload.items.length > 0
    ? payload.items.map(renderItemCard).join('')
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的内容。</section>`;

  return renderLayout({
    title: `搜索：${payload.query || '全部内容'}`,
    heading: '搜索结果',
    description: payload.query ? `关键词：${payload.query}` : '未提供关键词，显示默认结果。',
    body: `<section class="grid">${cards}</section>`
  });
}

export function renderPublicListPage(payload) {
  const cards = payload.items.length > 0
    ? payload.items.map(renderPublicItemCard).join('')
    : '<section class="empty">当前还没有公开内容。</section>';

  return renderLayout({
    title: '公开内容列表',
    heading: '公开内容列表',
    description: `共 ${payload.totalItems} 条公开内容，当前第 ${payload.page} 页。`,
    body: `<section class="grid">${cards}</section>`
  }).replace('action="/web/search"', 'action="/web/public/search"');
}

export function renderPublicSearchPage(payload) {
  const cards = payload.items.length > 0
    ? payload.items.map(renderPublicItemCard).join('')
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的公开内容。</section>`;

  return renderLayout({
    title: `公开搜索：${payload.query || '全部内容'}`,
    heading: '公开搜索结果',
    description: payload.query ? `关键词：${payload.query}` : '未提供关键词，显示默认公开结果。',
    body: `<section class="grid">${cards}</section>`
  }).replace('action="/web/search"', 'action="/web/public/search"');
}

export function renderOwnerDetailPage(detail) {
  const contentBlock = detail.type === 'rich_text'
    ? `<section class="card"><h2>HTML 预览</h2><iframe class="preview" sandbox="" srcdoc="${escapeHtml(detail.htmlContent)}"></iframe></section>`
    : `<section class="card"><h2>文件信息</h2><p>文件名：${escapeHtml(detail.originalFilename || '未提供')}</p><p>MIME：${escapeHtml(detail.mimeType || '-')}</p><p>大小：${escapeHtml(detail.fileSize || 0)} bytes</p>${detail.isShared ? `<p><a href="/web/public/content/${encodeURIComponent(detail.contentHash)}">打开公开访问页</a></p>` : '<p>当前未分享，外部公开访问不可用。</p>'}</section>`;

  return renderLayout({
    title: detail.title || detail.originalFilename || '内容详情',
    heading: detail.title || detail.originalFilename || '内容详情',
    description: `内容类型：${detail.type}；共享状态：${detail.isShared ? '已分享' : '未分享'}`,
    body: `<section class="detail"><section class="card"><h2>摘要</h2><div class="meta"><span>Content ID: ${escapeHtml(detail.contentId)}</span><span>Hash: ${escapeHtml(detail.contentHash)}</span><span>Owner: ${escapeHtml(detail.ownerUserId)}</span></div></section>${contentBlock}</section>`
  });
}

export function renderPublicContentPage(payload) {
  const body = payload.type === 'rich_text'
    ? `<section class="detail"><section class="card"><div class="badge">公开 HTML 内容</div><h2>${escapeHtml(payload.title || '未命名内容')}</h2><iframe class="preview" sandbox="" srcdoc="${escapeHtml(payload.htmlContent)}"></iframe></section></section>`
    : `<section class="detail"><section class="card"><div class="badge">公开文件</div><h2>${escapeHtml(payload.title || payload.originalFilename || '文件内容')}</h2><p>文件名：${escapeHtml(payload.download.filename)}</p><p>MIME：${escapeHtml(payload.download.mimeType)}</p><p><a href="${escapeHtml(payload.accessUrl)}">下载原始文件</a></p><p>说明：此链接返回原始文件字节流，不再通过页面内嵌 base64 交付。</p></section></section>`;

  return renderLayout({
    title: payload.title || payload.originalFilename || '公开访问',
    heading: '公开内容访问',
    description: `访问方式：${payload.access === 'share_link' ? '分享链接' : '内容 hash'}`,
    body
  });
}

export function renderErrorPage({ title, message, statusCode = 500 }) {
  return {
    statusCode,
    html: renderLayout({
      title,
      heading: title,
      description: '请求未能成功处理。',
      body: `<section class="error">${escapeHtml(message)}</section>`
    })
  };
}
