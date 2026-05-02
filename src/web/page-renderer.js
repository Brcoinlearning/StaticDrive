function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatFileSize(value) {
  const size = Number(value ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildSearchAction(mode) {
  return mode === 'public' ? '/web/public/search' : '/web/search';
}

function renderSearchForm(mode, query = '') {
  return `<form method="get" action="${buildSearchAction(mode)}" class="search-form">
    <input type="search" name="q" value="${escapeHtml(query)}" placeholder="按标题、文件名或内容关键词搜索" aria-label="搜索内容">
    <button type="submit">搜索</button>
  </form>`;
}

function renderLayout({ title, heading, description, body, mode = 'owner', query = '', eyebrow = 'Owner Console' }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --bg-ink: #201814;
        --surface: rgba(255, 250, 244, 0.92);
        --surface-strong: #fffdf8;
        --surface-soft: rgba(238, 227, 211, 0.75);
        --line: rgba(112, 79, 46, 0.18);
        --line-strong: rgba(112, 79, 46, 0.3);
        --text: #231a14;
        --muted: #66584c;
        --accent: #a34f28;
        --accent-strong: #7e3919;
        --accent-soft: rgba(163, 79, 40, 0.12);
        --success: #1d6b4f;
        --success-soft: rgba(29, 107, 79, 0.12);
        --danger: #a12f1f;
        --danger-soft: rgba(161, 47, 31, 0.11);
        --warning: #8b5a12;
        --warning-soft: rgba(139, 90, 18, 0.12);
        --shadow: 0 24px 60px rgba(63, 40, 18, 0.14);
      }

      * { box-sizing: border-box; }
      html { background: var(--bg); }
      body {
        margin: 0;
        color: var(--text);
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at 0% 0%, rgba(163, 79, 40, 0.14), transparent 28%),
          radial-gradient(circle at 100% 20%, rgba(117, 78, 35, 0.08), transparent 24%),
          linear-gradient(180deg, #fbf7f0 0%, var(--bg) 100%);
      }

      a {
        color: var(--accent-strong);
        text-decoration: none;
      }

      a:hover { text-decoration: underline; }

      button, input {
        font: inherit;
      }

      .page {
        width: min(1120px, calc(100vw - 28px));
        margin: 0 auto;
        padding: 24px 0 56px;
      }

      .masthead {
        position: relative;
        overflow: hidden;
        padding: 30px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background:
          linear-gradient(140deg, rgba(255, 252, 247, 0.97), rgba(241, 231, 217, 0.86)),
          var(--surface);
        box-shadow: var(--shadow);
      }

      .masthead::after {
        content: '';
        position: absolute;
        inset: auto -40px -60px auto;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(163, 79, 40, 0.18), transparent 68%);
        pointer-events: none;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.62);
        color: var(--muted);
        font-size: 0.86rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) minmax(280px, 0.95fr);
        gap: 18px;
        align-items: end;
      }

      h1, h2, h3, p { margin: 0; }
      h1 {
        max-width: 11ch;
        font-size: clamp(2.3rem, 5vw, 4rem);
        line-height: 0.95;
        letter-spacing: -0.04em;
      }

      .hero-copy {
        display: grid;
        gap: 12px;
      }

      .hero-copy p {
        max-width: 56ch;
        line-height: 1.65;
        color: var(--muted);
      }

      .hero-panel {
        display: grid;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 253, 249, 0.75);
      }

      .hero-panel-title {
        font-size: 0.92rem;
        color: var(--muted);
      }

      .hero-panel strong {
        font-size: 1.4rem;
        line-height: 1.1;
      }

      .search-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .search-form input {
        flex: 1 1 220px;
        min-width: 0;
        padding: 13px 16px;
        border: 1px solid var(--line-strong);
        border-radius: 999px;
        background: rgba(255,255,255,0.92);
      }

      .btn,
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
      }

      .btn.secondary,
      button.secondary {
        background: transparent;
        color: var(--accent-strong);
        border: 1px solid var(--line-strong);
      }

      .btn.danger,
      button.danger {
        background: var(--danger);
      }

      .section-stack {
        display: grid;
        gap: 18px;
        margin-top: 20px;
      }

      .toolbar,
      .flash,
      .card,
      .empty,
      .error,
      .panel {
        border-radius: 22px;
        border: 1px solid var(--line);
        background: var(--surface);
        box-shadow: 0 10px 30px rgba(59, 37, 18, 0.06);
      }

      .toolbar,
      .flash,
      .card,
      .panel {
        padding: 18px;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .toolbar .muted,
      .meta-grid .muted,
      .card p,
      .empty,
      .error,
      .flash {
        color: var(--muted);
      }

      .flash {
        display: grid;
        gap: 6px;
        padding: 16px 18px;
      }

      .flash strong {
        color: var(--bg-ink);
        font-size: 1.04rem;
      }

      .flash.success {
        border-color: rgba(29, 107, 79, 0.24);
        background: linear-gradient(180deg, rgba(255,255,255,0.8), var(--success-soft));
      }

      .flash.error {
        border-color: rgba(161, 47, 31, 0.24);
        background: linear-gradient(180deg, rgba(255,255,255,0.82), var(--danger-soft));
      }

      .flash.info {
        border-color: rgba(139, 90, 18, 0.24);
        background: linear-gradient(180deg, rgba(255,255,255,0.82), var(--warning-soft));
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .card {
        display: grid;
        gap: 14px;
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: start;
      }

      .card-title {
        display: grid;
        gap: 8px;
      }

      .card h2 {
        font-size: 1.35rem;
        line-height: 1.12;
      }

      .badge-row,
      .meta,
      .action-row,
      .inline-form,
      .batch-panel,
      .field-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-size: 0.88rem;
      }

      .badge.shared {
        background: var(--success-soft);
        color: var(--success);
      }

      .badge.private {
        background: rgba(102, 88, 76, 0.11);
        color: var(--muted);
      }

      .meta {
        color: var(--muted);
        font-size: 0.95rem;
      }

      .action-row form,
      .inline-form {
        margin: 0;
      }

      .detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.95fr);
        gap: 18px;
      }

      .detail-main,
      .detail-side {
        display: grid;
        gap: 18px;
      }

      .preview-shell {
        display: grid;
        gap: 14px;
      }

      iframe.preview {
        width: 100%;
        min-height: 460px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }

      .panel h3,
      .card h3 {
        margin-bottom: 10px;
        font-size: 1.1rem;
      }

      .field-stack,
      .batch-panel {
        flex-direction: column;
        align-items: stretch;
      }

      textarea,
      input[type="text"],
      select {
        width: 100%;
        min-width: 0;
        padding: 13px 16px;
        border: 1px solid var(--line-strong);
        border-radius: 16px;
        background: rgba(255,255,255,0.94);
        font: inherit;
        color: var(--text);
      }

      textarea {
        min-height: 220px;
        resize: vertical;
      }

      .batch-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: start;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.52);
      }

      .batch-item input[type="checkbox"] {
        margin-top: 4px;
      }

      .subtle-note {
        color: var(--muted);
        font-size: 0.94rem;
        line-height: 1.6;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .meta-grid strong {
        display: block;
        margin-bottom: 6px;
        font-size: 0.86rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .empty,
      .error {
        padding: 22px;
      }

      .empty {
        background: rgba(255, 252, 247, 0.82);
      }

      .error {
        background: linear-gradient(180deg, rgba(255,255,255,0.82), var(--danger-soft));
        color: var(--danger);
      }

      .supporting-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--accent-strong);
      }

      @media (max-width: 860px) {
        .hero-grid,
        .detail-layout {
          grid-template-columns: 1fr;
        }

        h1 {
          max-width: none;
        }
      }

      @media (max-width: 640px) {
        .page {
          width: min(100vw - 20px, 1120px);
          padding-top: 12px;
        }

        .masthead,
        .toolbar,
        .card,
        .panel,
        .flash,
        .empty,
        .error {
          border-radius: 18px;
        }

        .masthead {
          padding: 22px;
        }

        .meta-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="masthead">
        <div class="eyebrow">${escapeHtml(eyebrow)}</div>
        <div class="hero-grid">
          <div class="hero-copy">
            <h1>${escapeHtml(heading)}</h1>
            <p>${escapeHtml(description)}</p>
            ${renderSearchForm(mode, query)}
          </div>
          <aside class="hero-panel">
            <span class="hero-panel-title">当前入口</span>
            <strong>${escapeHtml(mode === 'public' ? 'Public Discovery' : 'Owner Content Console')}</strong>
            <span class="muted">${escapeHtml(mode === 'public' ? '公开访客浏览已发布内容。' : 'Owner 通过 API Key 管理已保存内容。')}</span>
          </aside>
        </div>
      </section>
      <section class="section-stack">
        ${body}
      </section>
    </main>
  </body>
</html>`;
}

function renderFlash(flash) {
  if (!flash?.message) {
    return '';
  }

  const tone = flash.tone === 'error' ? 'error' : flash.tone === 'info' ? 'info' : 'success';
  return `<section class="flash ${tone}"><strong>${escapeHtml(flash.title || '操作已完成')}</strong><span>${escapeHtml(flash.message)}</span></section>`;
}

function renderToolbar({ totalItems, page, query, missingLocalFileOnly = false, backHref = '/web/list', backLabel = '返回全部内容' }) {
  const summary = query
    ? `搜索“${query}”命中 ${totalItems} 条内容，第 ${page} 页。`
    : `当前共 ${totalItems} 条内容，第 ${page} 页。`;
  const filterForm = backHref === '/web/list'
    ? `<form method="get" action="/web/list" class="inline-form"><label><input type="checkbox" name="missingLocalFileOnly" value="1"${missingLocalFileOnly ? ' checked' : ''}> 仅看缺失本地文件</label><button type="submit" class="secondary">应用筛选</button></form>`
    : '';

  return `<section class="toolbar">
    <div>
      <strong>内容总览</strong>
      <div class="muted">${escapeHtml(summary)}</div>
    </div>
    <div class="action-row">${filterForm}<a class="btn secondary" href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a></div>
  </section>`;
}

function renderBatchPanel({ items, query = '', page = 1, missingLocalFileOnly = false }) {
  if (!items.length) {
    return '';
  }

  return `<section class="panel">
    <h3>批量操作</h3>
    <form method="post" action="/web/action/batch" class="batch-panel">
      ${query ? `<input type="hidden" name="query" value="${escapeHtml(query)}">` : ''}
      <input type="hidden" name="page" value="${escapeHtml(page)}">
      ${missingLocalFileOnly ? '<input type="hidden" name="missingLocalFileOnly" value="1">' : ''}
      <div class="field-stack">
        <label for="batchAction"><strong>批量动作</strong></label>
        <select id="batchAction" name="batchAction">
          <option value="share">批量分享</option>
          <option value="share_revoke">批量撤销分享</option>
          <option value="delete">批量删除</option>
          <option value="cleanup_missing_file_records">清理缺失文件记录</option>
        </select>
      </div>
      <div class="action-row">
        <button type="button" class="secondary" data-batch-toggle="all">全选当前页</button>
        <button type="button" class="secondary" data-batch-toggle="none">清空选择</button>
        <span class="subtle-note">当前批量选择只作用于本页已加载的记录。</span>
      </div>
      <div class="field-stack">
        ${items.map((item) => `<label class="batch-item"><input type="checkbox" name="contentIds" value="${escapeHtml(item.contentId)}"><span><strong>${escapeHtml(item.title || item.originalFilename || '未命名内容')}</strong><span class="subtle-note">${escapeHtml(item.contentId)} · ${escapeHtml(item.type === 'rich_text' ? '富文本' : '文件')} · ${escapeHtml(item.isShared ? '已公开' : '未公开')}</span></span></label>`).join('')}
      </div>
      <div class="action-row">
        <button type="submit">执行批量操作</button>
        <span class="subtle-note">批量删除会直接删除内容；批量分享与批量撤销分享会逐条复用现有写路径。</span>
      </div>
    </form>
    <script>
      (() => {
        const root = document.currentScript?.previousElementSibling?.previousElementSibling?.closest('form.batch-panel')
          ?? document.currentScript?.previousElementSibling?.closest('form.batch-panel')
          ?? document.currentScript?.parentElement?.querySelector('form.batch-panel');
        if (!root) return;
        const checkboxes = Array.from(root.querySelectorAll('input[name="contentIds"][type="checkbox"]'));
        root.querySelector('[data-batch-toggle="all"]')?.addEventListener('click', () => {
          for (const checkbox of checkboxes) checkbox.checked = true;
        });
        root.querySelector('[data-batch-toggle="none"]')?.addEventListener('click', () => {
          for (const checkbox of checkboxes) checkbox.checked = false;
        });
      })();
    </script>
  </section>`;
}

function renderOwnerTopbarLinks() {
  return `<div class="action-row"><a class="btn secondary" href="/web/credential">凭据与会话</a><form method="post" action="/web/auth/logout" class="inline-form"><button type="submit" class="secondary">退出</button></form></div>`;
}

export function renderLoginPage(payload = {}) {
  return renderLayout({
    title: 'Owner 登录',
    heading: '进入 Owner 控制台',
    description: '使用现有 API Key 登录浏览器会话。登录成功后，owner 页面将改用 HttpOnly session cookie 维持访问。',
    mode: 'owner',
    body: `${renderFlash(payload.flash)}<section class="detail-layout"><div class="detail-main"><section class="panel"><h3>API Key 登录</h3><form method="post" action="/web/auth/login" class="field-stack"><div class="field-stack"><label for="apiKey"><strong>API Key</strong></label><input id="apiKey" type="text" name="${escapeHtml(payload.apiKeyHeader || 'x-shutong49-api-key')}" placeholder="输入 owner API Key"></div><div class="action-row"><button type="submit">登录</button><span class="subtle-note">不会替代 Open API 的 header 模式；这里只是为浏览器 owner 使用提供更自然入口。</span></div></form></section></div><aside class="detail-side"><section class="panel"><h3>说明</h3><p>当前登录模型仍基于已存在的 <code>users_api.api_key</code>。</p><p>登录成功后服务端签发会话 cookie，浏览器后续访问 owner 页面不再需要手工注入请求头。</p></section></aside></section>`
  });
}

export function renderCredentialPage(payload) {
  const maskedApiKey = payload.user.apiKey.length <= 8 ? payload.user.apiKey : payload.user.apiKey.slice(0, 4) + ' ... ' + payload.user.apiKey.slice(-4);
  return renderLayout({
    title: 'Owner 凭据与会话',
    heading: 'Owner 凭据与会话',
    description: '查看当前 owner 身份、会话模型和 API Key 摘要。',
    mode: 'owner',
    body: `${renderFlash(payload.flash)}<section class="toolbar"><div><strong>凭据中心</strong><div class="muted">当前页面用于说明 owner 身份来源，不在本轮提供真实 API Key 轮换写操作。</div></div><a class="btn secondary" href="/web/list">返回列表</a></section><section class="detail-layout"><div class="detail-main"><section class="panel"><h3>当前身份</h3><div class="meta-grid"><div><strong>Display Name</strong><span>${escapeHtml(payload.user.displayName || '未命名 owner')}</span></div><div><strong>Owner ID</strong><span>${escapeHtml(payload.user.id)}</span></div><div><strong>API Key Header</strong><span>${escapeHtml(payload.apiKeyHeader)}</span></div><div><strong>Session Cookie</strong><span>${escapeHtml(payload.cookieName)}</span></div></div></section><section class="panel"><h3>API Key 摘要</h3><p><strong>${escapeHtml(maskedApiKey)}</strong></p><p class="subtle-note">为了避免在页面中完整暴露敏感凭据，这里只显示摘要。Open API 仍然可以继续直接使用原始 API Key 请求头。</p></section></div><aside class="detail-side"><section class="panel"><h3>后续方向</h3><p>下一轮若进入真正的凭据生命周期管理，可以在这里扩展：</p><div class="meta"><span>API Key 轮换</span><span>会话失效</span><span>设备管理</span></div><div class="action-row"><form method="post" action="/web/auth/logout" class="inline-form"><button type="submit">退出当前会话</button></form></div></section></aside></section>`
  });
}

function renderItemCard(item) {
  const sharedBadge = item.isShared
    ? '<span class="badge shared">已公开</span>'
    : '<span class="badge private">未公开</span>';
  const localFileWarning = item.type === 'file' && item.localFileExists === false
    ? '<p><strong>本地文件缺失</strong>，请重新上传或删除该记录。</p>'
    : '';
  const displayTitle = item.title || item.originalFilename || '未命名内容';
  const summaryLine = item.summary
    ? `<p>${escapeHtml(item.summary)}</p>`
    : '<p>暂无正文摘要。</p>';
  const authorLine = `作者：${escapeHtml(item.authorName || '未提供')}`;
  const createdAtLine = `创建时间：${escapeHtml(item.createdAt || '未提供')}`;
  const filenameLine = item.originalFilename
    ? `<p>源文件：${escapeHtml(item.originalFilename)}</p>`
    : '<p>富文本内容，无原始文件。</p>';

  return `<article class="card">
    <div class="card-head">
      <div class="card-title">
        <div class="badge-row"><span class="badge">${escapeHtml(item.type === 'rich_text' ? 'Rich Text' : 'File')}</span>${sharedBadge}</div>
        <h2><a href="/web/detail/${encodeURIComponent(item.contentId)}">${escapeHtml(displayTitle)}</a></h2>
      </div>
    </div>
    ${summaryLine}
    ${filenameLine}
    ${localFileWarning}
    <div class="meta">
      <span>${authorLine}</span>
      <span>${createdAtLine}</span>
      <span>内容 ID：${escapeHtml(item.contentId)}</span>
      <span>MIME：${escapeHtml(item.mimeType || '-')}</span>
      <span>大小：${escapeHtml(formatFileSize(item.fileSize))}</span>
    </div>
    <div class="action-row">
      <a class="btn secondary" href="/web/detail/${encodeURIComponent(item.contentId)}">查看详情</a>
      ${item.isShared ? `<a class="supporting-link" href="/web/public/content/${encodeURIComponent(item.contentHash)}">打开公开页</a>` : '<span class="muted">尚未公开，外部不可访问。</span>'}
    </div>
  </article>`;
}

function renderPublicItemCard(item) {
  const fileName = item.originalFilename ? `<p>源文件：${escapeHtml(item.originalFilename)}</p>` : '<p>公开富文本内容。</p>';
  return `<article class="card">
    <div class="card-head">
      <div class="card-title">
        <div class="badge-row"><span class="badge">${escapeHtml(item.type === 'rich_text' ? '公开富文本' : '公开文件')}</span></div>
        <h2><a href="${escapeHtml(item.publicPageUrl)}">${escapeHtml(item.title || item.originalFilename || '未命名内容')}</a></h2>
      </div>
    </div>
    ${fileName}
    <div class="meta">
      <span>Hash：${escapeHtml(item.contentHash)}</span>
      <span>MIME：${escapeHtml(item.mimeType || '-')}</span>
      <span>大小：${escapeHtml(formatFileSize(item.fileSize))}</span>
    </div>
  </article>`;
}

function renderOwnerUpdatePanel(detail) {
  const bodyField = detail.type === 'rich_text'
    ? `<div class="field-stack"><label for="body"><strong>正文内容</strong></label><textarea id="body" name="body">${escapeHtml(detail.body || '')}</textarea></div><div class="field-stack"><label for="bodyFormat"><strong>正文格式</strong></label><select id="bodyFormat" name="bodyFormat"><option value="html"${detail.bodyFormat === 'html' ? ' selected' : ''}>HTML</option><option value="markdown"${detail.bodyFormat === 'markdown' ? ' selected' : ''}>Markdown</option></select></div>`
    : '<p class="subtle-note">文件内容当前不支持在浏览器内替换二进制，只支持更新标题。</p>';

  return `<section class="panel">
    <h3>内容更新</h3>
    <form method="post" action="/web/action/update" class="field-stack">
      <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
      <div class="field-stack">
        <label for="title"><strong>标题</strong></label>
        <input id="title" type="text" name="title" value="${escapeHtml(detail.title || '')}">
      </div>
      ${bodyField}
      <div class="action-row">
        <button type="submit">保存更新</button>
        <span class="subtle-note">更新后内容 hash 不变，公开访问地址保持不变。</span>
      </div>
    </form>
  </section>`;
}

function renderOwnerActionPanel(detail) {
  const shareAction = detail.isShared
    ? `<form method="post" action="/web/action/share/revoke" class="inline-form">
        <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
        <button type="submit" class="secondary">撤销分享</button>
      </form>`
    : `<form method="post" action="/web/action/share" class="inline-form">
        <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
        <button type="submit">创建分享</button>
      </form>`;

  const publicLinks = detail.isShared
    ? `<div class="meta-grid">
        <div>
          <strong>公开访问页</strong>
          <a class="supporting-link" href="/web/public/content/${encodeURIComponent(detail.contentHash)}">打开内容公开页</a>
        </div>
        <div>
          <strong>直接访问地址</strong>
          <a class="supporting-link" href="${escapeHtml(detail.accessUrl)}">打开原始公开接口</a>
        </div>
      </div>`
    : '<p class="muted">当前内容未公开，外部用户无法访问。</p>';

  return `<section class="panel">
    <h3>Owner 操作</h3>
    <div class="action-row">
      ${shareAction}
      <form method="post" action="/web/action/delete" class="inline-form" onsubmit="return confirm('确认删除该内容吗？');">
        <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
        <button type="submit" class="danger">删除内容</button>
      </form>
    </div>
    ${publicLinks}
  </section>`;
}

export function renderOwnerListPage(payload) {
  const cards = payload.items.length > 0
    ? `<section class="cards">${payload.items.map(renderItemCard).join('')}</section>`
    : '<section class="empty">当前还没有内容。你可以先通过 Open API 写入文件或富文本，再回到这里查看。</section>';

  return renderLayout({
    title: 'Owner 内容列表',
    heading: 'Owner 内容列表',
    description: '这里是 owner 侧的主入口。你可以浏览已写入内容、确认公开状态，并进入详情页继续执行分享、撤销分享、更新或删除。',
    mode: 'owner',
    body: `${renderFlash(payload.flash)}${renderToolbar({ totalItems: payload.totalItems, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly })}${renderOwnerTopbarLinks()}${renderBatchPanel({ items: payload.items, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly })}${cards}`
  });
}

export function renderOwnerSearchPage(payload) {
  const cards = payload.items.length > 0
    ? `<section class="cards">${payload.items.map(renderItemCard).join('')}</section>`
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的内容。你可以调整关键词，或返回全部内容列表继续查看。</section>`;

  return renderLayout({
    title: `Owner 搜索：${payload.query || '全部内容'}`,
    heading: 'Owner 搜索结果',
    description: payload.query ? `当前展示与“${payload.query}”相关的 owner 内容。` : '未提供关键词，显示默认结果。',
    mode: 'owner',
    query: payload.query,
    body: `${renderFlash(payload.flash)}${renderToolbar({ totalItems: payload.totalItems, page: payload.page, query: payload.query, missingLocalFileOnly: payload.missingLocalFileOnly, backHref: '/web/list' })}${renderOwnerTopbarLinks()}${renderBatchPanel({ items: payload.items, query: payload.query, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly })}${cards}`
  });
}

export function renderPublicListPage(payload) {
  const cards = payload.items.length > 0
    ? `<section class="cards">${payload.items.map(renderPublicItemCard).join('')}</section>`
    : '<section class="empty">当前还没有公开内容。</section>';

  return renderLayout({
    title: '公开内容列表',
    heading: '公开内容列表',
    description: '公开访客可以在这里浏览已经发布的文件与富文本，并继续进入详情页或下载原始文件。',
    mode: 'public',
    eyebrow: 'Public Discovery',
    body: `${renderToolbar({ totalItems: payload.totalItems, page: payload.page, backHref: '/web/public/list', backLabel: '刷新公开列表' })}${cards}`
  });
}

export function renderPublicSearchPage(payload) {
  const cards = payload.items.length > 0
    ? `<section class="cards">${payload.items.map(renderPublicItemCard).join('')}</section>`
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的公开内容。</section>`;

  return renderLayout({
    title: `公开搜索：${payload.query || '全部内容'}`,
    heading: '公开搜索结果',
    description: payload.query ? `当前展示与“${payload.query}”相关的公开内容。` : '未提供关键词，显示默认公开结果。',
    mode: 'public',
    query: payload.query,
    eyebrow: 'Public Discovery',
    body: `${renderToolbar({ totalItems: payload.totalItems, page: payload.page, query: payload.query, backHref: '/web/public/list', backLabel: '返回公开列表' })}${cards}`
  });
}

export function renderOwnerDetailPage(detail) {
  const contentBlock = detail.type === 'rich_text'
    ? `<section class="panel preview-shell"><div class="badge-row"><span class="badge">${escapeHtml(detail.bodyFormat === 'markdown' ? 'Markdown 渲染预览' : 'HTML 预览')}</span></div><h3>最终展示预览</h3><iframe class="preview" sandbox="" srcdoc="${escapeHtml(detail.renderedBodyHtml || detail.htmlContent || '')}"></iframe></section>`
    : `<section class="panel"><h3>文件交付信息</h3><div class="meta-grid"><div><strong>文件名</strong><span>${escapeHtml(detail.originalFilename || '未提供')}</span></div><div><strong>MIME</strong><span>${escapeHtml(detail.mimeType || '-')}</span></div><div><strong>大小</strong><span>${escapeHtml(formatFileSize(detail.fileSize))}</span></div><div><strong>本地文件状态</strong><span>${escapeHtml(detail.localFileExists === false ? '本地文件缺失' : '文件存在')}</span></div><div><strong>文件访问</strong>${detail.isShared ? `<a class="supporting-link" href="/web/public/content/${encodeURIComponent(detail.contentHash)}">打开公开下载页</a>` : '<span class="muted">未分享，无法公开下载。</span>'}</div></div>${detail.localFileExists === false ? '<p class="subtle-note">请重新上传或删除该记录，否则数据库记录与物理文件将持续不一致。</p>' : ''}</section>`;

  return renderLayout({
    title: detail.title || detail.originalFilename || 'Owner 内容详情',
    heading: detail.title || detail.originalFilename || 'Owner 内容详情',
    description: `内容类型：${detail.type === 'rich_text' ? '富文本' : '文件'}；当前状态：${detail.isShared ? '已公开' : '未公开'}。`,
    mode: 'owner',
    body: `${renderFlash(detail.flash)}<section class="toolbar"><div><strong>单内容操作中心</strong><div class="muted">在这个页面完成查看、分享、撤销分享、更新和删除。</div></div><div class="action-row"><a class="btn secondary" href="/web/list">返回列表</a><a class="btn secondary" href="/web/credential">凭据与会话</a></div></section><section class="detail-layout"><div class="detail-main"><section class="panel"><h3>摘要</h3><div class="meta-grid"><div><strong>Content ID</strong><span>${escapeHtml(detail.contentId)}</span></div><div><strong>内容 Hash</strong><span>${escapeHtml(detail.contentHash)}</span></div><div><strong>Owner</strong><span>${escapeHtml(detail.ownerUserId)}</span></div><div><strong>共享状态</strong><span>${escapeHtml(detail.isShared ? '已分享' : '未分享')}</span></div></div></section>${contentBlock}</div><aside class="detail-side">${renderOwnerUpdatePanel(detail)}${renderOwnerActionPanel(detail)}</aside></section>`
  });
}

export function renderPublicContentPage(payload) {
  const body = payload.type === 'rich_text'
    ? `<section class="detail-layout"><div class="detail-main"><section class="panel preview-shell"><div class="badge-row"><span class="badge">${escapeHtml(payload.bodyFormat === 'markdown' ? '公开 Markdown 渲染内容' : '公开 HTML 内容')}</span></div><h2>${escapeHtml(payload.title || '未命名内容')}</h2><iframe class="preview" sandbox="" srcdoc="${escapeHtml(payload.renderedBodyHtml || payload.htmlContent || '')}"></iframe></section></div><aside class="detail-side"><section class="panel"><h3>访问说明</h3><p>当前页面展示的是已公开富文本内容，外部访客无需登录即可查看。</p><div class="meta"><span>访问方式：${escapeHtml(payload.access === 'share_link' ? '分享链接' : '内容 hash')}</span><span>正文格式：${escapeHtml(payload.bodyFormat || 'html')}</span></div></section></aside></section>`
    : `<section class="detail-layout"><div class="detail-main"><section class="panel"><div class="badge-row"><span class="badge">公开文件</span></div><h2>${escapeHtml(payload.title || payload.originalFilename || '文件内容')}</h2><p>文件名：${escapeHtml(payload.download.filename)}</p><p>MIME：${escapeHtml(payload.download.mimeType)}</p><p><a class="btn" href="${escapeHtml(payload.accessUrl)}">下载原始文件</a></p><p>该地址直接返回原始文件字节流，适合浏览器下载与外部系统拉取。</p></section></div><aside class="detail-side"><section class="panel"><h3>访问说明</h3><div class="meta"><span>访问方式：${escapeHtml(payload.access === 'share_link' ? '分享链接' : '内容 hash')}</span><span>大小：${escapeHtml(formatFileSize(payload.fileSize))}</span></div></section></aside></section>`;

  return renderLayout({
    title: payload.title || payload.originalFilename || '公开访问',
    heading: '公开内容访问',
    description: '公开访客可以在此查看富文本内容，或下载 owner 发布的原始文件。',
    mode: 'public',
    eyebrow: 'Public Delivery',
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
