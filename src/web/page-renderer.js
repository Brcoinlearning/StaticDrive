import { escapeHtml, formatFileSize } from './html-utils.js';
import { renderIcon } from './icons.js';
import { buildPreviewSrcdoc } from './preview-srcdoc.js';
import { renderAppStyles } from './app-styles.js';

function buildSearchAction(mode) {
  return mode === 'public' ? '/web/public/search' : '/web/search';
}

function renderSearchForm(mode, query = '') {
  return `<form method="get" action="${buildSearchAction(mode)}" class="search-form">
    <label class="sr-only" for="global-search">搜索内容</label>
    <input id="global-search" type="search" name="q" value="${escapeHtml(query)}" placeholder="按标题、文件名或内容关键词搜索" aria-label="搜索内容">
    <button type="submit">${renderIcon('search')}搜索</button>
  </form>`;
}

function renderShellNav(mode, activeNav = mode === 'public' ? 'public' : 'owner') {
  const ownerActive = mode !== 'public';
  const navItems = [
    { key: 'owner', href: '/web/list', icon: 'shield', label: 'Owner 管理' },
    { key: 'write', href: '/web/write', icon: 'edit', label: '写入内容' },
    { key: 'credential', href: '/web/credential', icon: 'key', label: '凭据中心' },
    { key: 'public', href: '/web/public/list', icon: 'external', label: '公开发现' }
  ];
  return `<aside class="side-rail" aria-label="页面导航">
    <a class="brand-lockup" href="${ownerActive ? '/web/list' : '/web/public/list'}">
      <span class="brand-mark">${renderIcon('file')}</span>
      <span><strong>静态内容服务</strong><small>Local publishing console</small></span>
    </a>
    <nav class="rail-nav" aria-label="主要入口">
      ${navItems.map((item) => {
        const active = activeNav === item.key;
        return `<a class="${active ? 'active' : ''}" href="${item.href}"${active ? ' aria-current="page"' : ''}>${renderIcon(item.icon)}${item.label}</a>`;
      }).join('')}
    </nav>
    <div class="rail-note">
      <span>${renderIcon(ownerActive ? 'shield' : 'external')}</span>
      <p>${escapeHtml(ownerActive ? '管理写入、分享、撤销与本地文件状态。' : '浏览已公开的富文本与文件交付页。')}</p>
    </div>
  </aside>`;
}

function renderLayout({ title, heading, description, body, mode = 'owner', activeNav, query = '', eyebrow = 'Owner Console' }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    ${renderAppStyles()}
  </head>
  <body>
    <a class="skip-link" href="#main-content">跳到主内容</a>
    <div class="app-shell">
      ${renderShellNav(mode, activeNav)}
      <main id="main-content" class="page" tabindex="-1">
      <header class="masthead">
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
      </header>
      <section class="section-stack">
        ${body}
      </section>
      </main>
    </div>
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

function buildOwnerFilterHref({ query = '', missingLocalFileOnly = false, layout = 'cards' }) {
  const base = query ? `/web/search?q=${encodeURIComponent(query)}` : '/web/list';
  const params = new URLSearchParams(query ? base.split('?')[1] : '');
  params.set('layout', layout);
  if (!missingLocalFileOnly) {
    params.set('missingLocalFileOnly', '1');
  } else {
    params.delete('missingLocalFileOnly');
  }
  return (query ? '/web/search' : '/web/list') + (params.toString() ? `?${params.toString()}` : '');
}

function renderToolbar({ totalItems, page, query, missingLocalFileOnly = false, backHref = '/web/list', backLabel = '返回全部内容', layout = 'cards', toggleLayoutHref = '?layout=rows', ownerTools = false, batchAvailable = false }) {
  const summary = query
    ? `搜索“${query}”命中 ${totalItems} 条内容，第 ${page} 页。`
    : `当前共 ${totalItems} 条内容，第 ${page} 页。`;
  const toggleLabel = layout === 'rows' ? '卡片视图' : '横条视图';
  const toggleIcon = layout === 'rows' ? 'grid' : 'list';
  const backIcon = backLabel.includes('刷新') ? 'refresh' : 'arrow';
  const ownerToolButtons = ownerTools
    ? `<a class="btn secondary${missingLocalFileOnly ? ' is-active' : ''}" href="${escapeHtml(buildOwnerFilterHref({ query, missingLocalFileOnly, layout }))}">${renderIcon('check')}${escapeHtml(missingLocalFileOnly ? '查看全部' : '筛选')}</a><button type="button" class="secondary batch-mode-toggle" aria-pressed="false" aria-expanded="false" aria-controls="batch-action-dock"${batchAvailable ? '' : ' disabled'}>${renderIcon('check')}批量管理</button><a class="btn secondary" href="${escapeHtml(toggleLayoutHref)}">${renderIcon(toggleIcon)}${escapeHtml(toggleLabel)}</a>`
    : '';
  const fallbackTools = `<a class="btn secondary" href="${escapeHtml(toggleLayoutHref)}">${renderIcon(toggleIcon)}${escapeHtml(toggleLabel)}</a><a class="btn secondary" href="${escapeHtml(backHref)}">${renderIcon(backIcon)}${escapeHtml(backLabel)}</a>`;

  return `<section class="toolbar">
    <div>
      <strong>内容总览</strong>
      <div class="muted">${escapeHtml(summary)}</div>
    </div>
    <div class="action-row">${ownerToolButtons || fallbackTools}</div>
  </section>`;
}

function renderBatchSelect(item) {
  return `<label class="batch-select" aria-label="选择 ${escapeHtml(item.title || item.originalFilename || item.contentId || '内容')}"><input type="checkbox" name="contentIds" value="${escapeHtml(item.contentId)}"></label>`;
}

function renderBatchModeForm({ items, toolbarHtml, contentHtml, query = '', page = 1, missingLocalFileOnly = false }) {
  if (!items.length) {
    return `${toolbarHtml}${contentHtml}`;
  }

  return `<form method="post" action="/web/action/batch" class="batch-mode-form" data-batch-mode>
    ${query ? `<input type="hidden" name="query" value="${escapeHtml(query)}">` : ''}
    <input type="hidden" name="page" value="${escapeHtml(page)}">
    ${missingLocalFileOnly ? '<input type="hidden" name="missingLocalFileOnly" value="1">' : ''}
    ${toolbarHtml}
    <section id="batch-action-dock" class="batch-action-dock" role="region" aria-label="批量动作">
      <span class="batch-mode-count" data-batch-count aria-live="polite">选择要处理的内容</span>
      <button type="button" class="secondary" data-batch-toggle="all">${renderIcon('check')}全选当前页</button>
      <button type="button" class="secondary" data-batch-toggle="none">${renderIcon('x')}清空选择</button>
      <button type="submit" class="secondary" name="batchAction" value="share" disabled>${renderIcon('share')}批量分享</button>
      <button type="submit" class="secondary" name="batchAction" value="share_revoke" disabled>${renderIcon('share-off')}批量撤销分享</button>
      <button type="submit" class="secondary" name="batchAction" value="cleanup_missing_file_records" disabled>${renderIcon('trash')}清理缺失</button>
      <button type="submit" class="secondary batch-action-danger" name="batchAction" value="delete" disabled>${renderIcon('trash')}批量删除</button>
    </section>
    ${contentHtml}
    <script>
      (() => {
        const form = document.currentScript?.closest('form[data-batch-mode]');
        if (!form) return;
        const toggle = form.querySelector('.batch-mode-toggle');
        const count = form.querySelector('[data-batch-count]');
        const submitButtons = Array.from(form.querySelectorAll('button[type="submit"][name="batchAction"]'));
        const checkboxes = Array.from(form.querySelectorAll('input[name="contentIds"][type="checkbox"]'));

        const updateState = () => {
          const active = form.classList.contains('is-batch-active');
          const selected = checkboxes.filter((checkbox) => checkbox.checked).length;
          if (count) count.textContent = selected ? '已选择 ' + selected + ' 项' : '选择要处理的内容';
          for (const button of submitButtons) button.disabled = !active || selected === 0;
        };

        toggle?.addEventListener('click', () => {
          const nextActive = form.classList.toggle('is-batch-active');
          toggle.setAttribute('aria-pressed', String(nextActive));
          toggle.setAttribute('aria-expanded', String(nextActive));
          if (!nextActive) {
            for (const checkbox of checkboxes) checkbox.checked = false;
          }
          updateState();
        });

        for (const checkbox of checkboxes) {
          checkbox.addEventListener('change', updateState);
        }
        form.querySelector('[data-batch-toggle="all"]')?.addEventListener('click', () => {
          for (const checkbox of checkboxes) checkbox.checked = true;
          updateState();
        });
        form.querySelector('[data-batch-toggle="none"]')?.addEventListener('click', () => {
          for (const checkbox of checkboxes) checkbox.checked = false;
          updateState();
        });
        updateState();
      })();
    </script>
  </form>`;
}

export function renderLoginPage(payload = {}) {
  return renderLayout({
    title: 'Owner 登录',
    heading: '进入 Owner 控制台',
    description: '使用现有 API Key 登录浏览器会话。登录成功后，owner 页面将改用 HttpOnly session cookie 维持访问。',
    mode: 'owner',
    activeNav: 'owner',
    body: `${renderFlash(payload.flash)}<section class="detail-layout"><div class="detail-main"><section class="panel"><h3>${renderIcon('key')}API Key 登录</h3><form method="post" action="/web/auth/login" class="field-stack"><div class="field-stack"><label for="apiKey"><strong>API Key</strong></label><input id="apiKey" type="text" name="${escapeHtml(payload.apiKeyHeader || 'x-shutong49-api-key')}" placeholder="输入 owner API Key" autocomplete="current-password" required></div><div class="action-row"><button type="submit">${renderIcon('key')}登录</button><span class="subtle-note">不会替代 Open API 的 header 模式；这里只是为浏览器 owner 使用提供更自然入口。</span></div></form></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('shield')}说明</h3><p>当前登录模型仍基于已存在的 <code>users_api.api_key</code>。</p><p>登录成功后服务端签发会话 cookie，浏览器后续访问 owner 页面不再需要手工注入请求头。</p></section></aside></section>`
  });
}

export function renderCredentialPage(payload) {
  const maskedApiKey = payload.user.apiKey.length <= 8 ? payload.user.apiKey : payload.user.apiKey.slice(0, 4) + ' ... ' + payload.user.apiKey.slice(-4);
  return renderLayout({
    title: 'Owner 凭据与会话',
    heading: 'Owner 凭据与会话',
    description: '查看当前 owner 身份、会话模型和 API Key 摘要。',
    mode: 'owner',
    activeNav: 'credential',
    body: `${renderFlash(payload.flash)}<section class="toolbar"><div><strong>凭据中心</strong><div class="muted">当前页面用于说明 owner 身份来源，不在本轮提供真实 API Key 轮换写操作。</div></div><a class="btn secondary" href="/web/list">${renderIcon('arrow')}返回列表</a></section><section class="detail-layout"><div class="detail-main"><section class="panel"><h3>${renderIcon('shield')}当前身份</h3><div class="meta-grid"><div><strong>Display Name</strong><span>${escapeHtml(payload.user.displayName || '未命名 owner')}</span></div><div><strong>Owner ID</strong><span>${escapeHtml(payload.user.id)}</span></div><div><strong>API Key Header</strong><span>${escapeHtml(payload.apiKeyHeader)}</span></div><div><strong>Session Cookie</strong><span>${escapeHtml(payload.cookieName)}</span></div></div></section><section class="panel"><h3>${renderIcon('key')}API Key 摘要</h3><p><strong>${escapeHtml(maskedApiKey)}</strong></p><p class="subtle-note">为了避免在页面中完整暴露敏感凭据，这里只显示摘要。Open API 仍然可以继续直接使用原始 API Key 请求头。</p></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('edit')}后续方向</h3><p>下一轮若进入真正的凭据生命周期管理，可以在这里扩展：</p><div class="meta"><span>API Key 轮换</span><span>会话失效</span><span>设备管理</span></div><div class="action-row"><form method="post" action="/web/auth/logout" class="inline-form"><button type="submit">${renderIcon('log-out')}退出当前会话</button></form></div></section></aside></section>`
  });
}

function renderItemCard(item) {
  const sharedBadge = item.isShared
    ? `<span class="badge shared">${renderIcon('share')}已公开</span>`
    : `<span class="badge private">${renderIcon('lock')}未公开</span>`;
  const localFileWarning = item.type === 'file' && item.localFileExists === false
    ? `<p><strong>${renderIcon('warning')}本地文件缺失</strong>，请重新上传或删除该记录。</p>`
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

  return `<article class="card owner-content-card">
    ${renderBatchSelect(item)}
    <div class="card-head">
      <div class="card-title">
        <div class="badge-row"><span class="badge">${renderIcon(item.type === 'rich_text' ? 'text' : 'file')}${escapeHtml(item.type === 'rich_text' ? 'Rich Text' : 'File')}</span>${sharedBadge}</div>
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
      <a class="btn secondary" href="/web/detail/${encodeURIComponent(item.contentId)}">${renderIcon('external')}查看详情</a>
      ${item.isShared ? `<a class="supporting-link" href="/web/public/content/${encodeURIComponent(item.contentHash)}">${renderIcon('external')}打开公开页</a>` : `<span class="muted">${renderIcon('lock')}尚未公开，外部不可访问。</span>`}
    </div>
  </article>`;
}

function renderItemRow(item) {
  const sharedBadge = item.isShared
    ? `<span class="badge shared">${renderIcon('share')}已公开</span>`
    : `<span class="badge private">${renderIcon('lock')}未公开</span>`;
  const displayTitle = item.title || item.originalFilename || '未命名内容';
  const summaryLine = item.summary
    ? `<p class="row-summary">${escapeHtml(item.summary)}</p>`
    : '';
  const authorLine = item.authorName ? `作者：${escapeHtml(item.authorName)}` : '';
  const createdAtLine = item.createdAt ? `创建：${escapeHtml(item.createdAt)}` : '';

  return `<article class="card list-row owner-content-card">
    ${renderBatchSelect(item)}
    <div class="list-row-body">
      <div class="badge-row"><span class="badge">${renderIcon(item.type === 'rich_text' ? 'text' : 'file')}${escapeHtml(item.type === 'rich_text' ? 'Rich Text' : 'File')}</span>${sharedBadge}</div>
      <h3><a href="/web/detail/${encodeURIComponent(item.contentId)}">${escapeHtml(displayTitle)}</a></h3>
      ${summaryLine}
      <div class="meta row-meta">
        ${authorLine ? `<span>${authorLine}</span>` : ''}
        ${createdAtLine ? `<span>${createdAtLine}</span>` : ''}
        <span>大小：${escapeHtml(formatFileSize(item.fileSize))}</span>
      </div>
    </div>
    <div class="list-row-action">
      <a class="btn secondary" href="/web/detail/${encodeURIComponent(item.contentId)}">${renderIcon('external')}查看详情</a>
      ${item.isShared ? `<a class="supporting-link" href="/web/public/content/${encodeURIComponent(item.contentHash)}">${renderIcon('external')}公开页</a>` : `<span class="muted">${renderIcon('lock')}未公开</span>`}
    </div>
  </article>`;
}

function renderPublicItemRow(item) {
  const displayTitle = item.title || item.originalFilename || '未命名内容';
  const summaryLine = item.summary
    ? `<p class="row-summary">${escapeHtml(item.summary)}</p>`
    : '';
  const typeLabel = item.type === 'rich_text' ? '公开富文本' : '公开文件';
  const createdAtLine = item.createdAt ? `创建：${escapeHtml(item.createdAt)}` : '';
  const updatedAtLine = item.updatedAt ? `更新：${escapeHtml(item.updatedAt)}` : '';

  return `<article class="card list-row">
    <div class="list-row-body">
      <div class="badge-row"><span class="badge">${renderIcon(item.type === 'rich_text' ? 'text' : 'file')}${escapeHtml(typeLabel)}</span></div>
      <h3><a href="${escapeHtml(item.publicPageUrl)}">${escapeHtml(displayTitle)}</a></h3>
      ${summaryLine}
      <div class="meta row-meta">
        ${createdAtLine ? `<span>${createdAtLine}</span>` : ''}
        ${updatedAtLine ? `<span>${updatedAtLine}</span>` : ''}
        <span>大小：${escapeHtml(formatFileSize(item.fileSize))}</span>
      </div>
    </div>
    <div class="list-row-action">
      <a class="btn secondary" href="${escapeHtml(item.publicPageUrl)}">${renderIcon('external')}查看详情</a>
    </div>
  </article>`;
}

function renderPublicItemCard(item) {
  const displayTitle = item.title || item.originalFilename || '未命名内容';
  const summaryLine = item.summary
    ? `<p>${escapeHtml(item.summary)}</p>`
    : '<p>暂无正文摘要。</p>';
  const typeLabel = item.type === 'rich_text' ? '公开富文本' : '公开文件';
  const subLine = item.type === 'rich_text'
    ? `<p>富文本内容，正文格式：${escapeHtml(item.bodyFormat || 'html')}</p>`
    : (item.originalFilename ? `<p>源文件：${escapeHtml(item.originalFilename)}</p>` : '');
  const createdAtLine = item.createdAt ? `创建时间：${escapeHtml(item.createdAt)}` : '';
  const updatedAtLine = item.updatedAt ? `更新时间：${escapeHtml(item.updatedAt)}` : '';

  return `<article class="card">
    <div class="card-head">
      <div class="card-title">
        <div class="badge-row"><span class="badge">${renderIcon(item.type === 'rich_text' ? 'text' : 'file')}${escapeHtml(typeLabel)}</span></div>
        <h2><a href="${escapeHtml(item.publicPageUrl)}">${escapeHtml(displayTitle)}</a></h2>
      </div>
    </div>
    ${summaryLine}
    ${subLine}
    <div class="meta">
      ${createdAtLine ? `<span>${createdAtLine}</span>` : ''}
      ${updatedAtLine ? `<span>${updatedAtLine}</span>` : ''}
      <span>MIME：${escapeHtml(item.mimeType || '-')}</span>
      <span>大小：${escapeHtml(formatFileSize(item.fileSize))}</span>
    </div>
  </article>`;
}

function renderOwnerUpdatePanel(detail) {
  const currentAccessMode = detail.accessMode === 'password' ? 'password' : 'public';
  const passwordFieldsAttrs = currentAccessMode === 'password' ? '' : ' hidden';
  const bodyField = detail.type === 'rich_text'
    ? `<div class="field-stack"><label for="body"><strong>正文内容</strong></label><textarea id="body" name="body">${escapeHtml(detail.body || '')}</textarea></div><div class="field-stack"><label for="bodyFormat"><strong>正文格式</strong></label><select id="bodyFormat" name="bodyFormat"><option value="html"${detail.bodyFormat === 'html' ? ' selected' : ''}>HTML</option><option value="markdown"${detail.bodyFormat === 'markdown' ? ' selected' : ''}>Markdown</option></select></div>`
    : '<p class="subtle-note">文件内容当前不支持在浏览器内替换二进制，只支持更新标题。</p>';

  return `<section class="panel">
    <h3>${renderIcon('edit')}内容更新</h3>
    <form method="post" action="/web/action/update" class="field-stack">
      <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
      <div class="field-stack">
        <label for="title"><strong>标题</strong></label>
        <input id="title" type="text" name="title" value="${escapeHtml(detail.title || '')}">
      </div>
      ${bodyField}
      <div class="field-stack">
        <label for="accessMode"><strong>访问模式</strong></label>
        <select id="accessMode" name="accessMode">
          <option value="public"${currentAccessMode === 'public' ? ' selected' : ''}>public（公开）</option>
          <option value="password"${currentAccessMode === 'password' ? ' selected' : ''}>password（密码保护）</option>
        </select>
      </div>
      <div class="field-stack" data-password-field="password"${passwordFieldsAttrs}>
        <label for="accessPassword"><strong>访问密码</strong></label>
        <input id="accessPassword" type="password" name="accessPassword" placeholder="留空表示不修改当前密码；切回 public 时会自动清除"${currentAccessMode === 'password' ? '' : ' disabled'}>
      </div>
      <div class="field-stack" data-password-field="hint"${passwordFieldsAttrs}>
        <label for="accessHint"><strong>访问提示（可选）</strong></label>
        <input id="accessHint" type="text" name="accessHint" value="${escapeHtml(detail.accessHint || '')}" placeholder="例如：项目代号 / 分享口令提示"${currentAccessMode === 'password' ? '' : ' disabled'}>
      </div>
      <div class="action-row">
        <button type="submit">${renderIcon('check')}保存更新</button>
        <span class="subtle-note">更新后内容 hash 不变，公开访问地址保持不变。</span>
      </div>
    </form>
    <script>
      (() => {
        const mode = document.getElementById('accessMode');
        const passwordGroup = document.querySelector('[data-password-field="password"]');
        const hintGroup = document.querySelector('[data-password-field="hint"]');
        const passwordInput = document.getElementById('accessPassword');
        const hintInput = document.getElementById('accessHint');
        if (!mode || !passwordGroup || !hintGroup || !passwordInput || !hintInput) {
          return;
        }

        const sync = () => {
          const enabled = mode.value === 'password';
          passwordGroup.hidden = !enabled;
          hintGroup.hidden = !enabled;
          passwordInput.disabled = !enabled;
          hintInput.disabled = !enabled;
          if (!enabled) {
            passwordInput.value = '';
          }
        };

        mode.addEventListener('change', sync);
        sync();
      })();
    </script>
  </section>`;
}

function renderOwnerActionPanel(detail) {
  const shareAction = detail.isShared
    ? `<form method="post" action="/web/action/share/revoke" class="inline-form">
        <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
        <button type="submit" class="secondary">${renderIcon('share-off')}撤销分享</button>
      </form>`
    : `<form method="post" action="/web/action/share" class="inline-form">
        <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
        <button type="submit">${renderIcon('share')}创建分享</button>
      </form>`;

  const publicLinks = detail.isShared
    ? `<div class="meta-grid">
        <div>
          <strong>公开访问页</strong>
          <a class="supporting-link" href="/web/public/content/${encodeURIComponent(detail.contentHash)}">${renderIcon('external')}打开内容公开页</a>
        </div>
        <div>
          <strong>原始接口地址</strong>
          <a class="supporting-link" href="${escapeHtml(detail.publicApiUrl || detail.accessUrl)}">${renderIcon('external')}打开原始公开接口</a>
        </div>
      </div>`
    : `<p class="muted">${renderIcon('lock')}当前内容未公开，外部用户无法访问。</p>`;

  return `<section class="panel">
    <h3>${renderIcon('shield')}Owner 操作</h3>
    <div class="action-row">
      ${shareAction}
      <details class="danger-zone">
        <summary>${renderIcon('trash')}删除选项</summary>
        <p class="subtle-note">删除会移除内容记录，并撤销相关分享链接。</p>
        <form method="post" action="/web/action/delete" class="inline-form">
          <input type="hidden" name="contentId" value="${escapeHtml(detail.contentId)}">
          <button type="submit" class="danger">${renderIcon('trash')}删除内容</button>
        </form>
      </details>
    </div>
    ${publicLinks}
  </section>`;
}

function buildLayoutToggleHref(currentHref, currentLayout) {
  const nextLayout = currentLayout === 'rows' ? 'cards' : 'rows';
  const q = currentHref.includes('?') ? currentHref.split('?')[1] : '';
  const params = new URLSearchParams(q);
  params.delete('layout');
  params.set('layout', nextLayout);
  return '?' + params.toString();
}

export function renderOwnerListPage(payload) {
  const layout = payload.layout || 'rows';
  const sectionClass = layout === 'rows' ? 'cards list-rows' : 'cards';
  const renderFn = layout === 'rows' ? renderItemRow : renderItemCard;
  const toggleHref = buildLayoutToggleHref(`/web/list${payload.missingLocalFileOnly ? '?missingLocalFileOnly=1' : ''}`, layout);
  const cards = payload.items.length > 0
    ? `<section class="${sectionClass}">${payload.items.map(renderFn).join('')}</section>`
    : '<section class="empty">当前还没有内容。你可以先通过 Open API 写入文件或富文本，再回到这里查看。</section>';
  const toolbar = renderToolbar({ totalItems: payload.totalItems, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly, layout, toggleLayoutHref: toggleHref, ownerTools: true, batchAvailable: payload.items.length > 0 });

  return renderLayout({
    title: 'Owner 内容列表',
    heading: 'Owner 内容列表',
    description: '这里是 owner 侧的主入口。你可以浏览已写入内容、确认公开状态，并进入详情页继续执行分享、撤销分享、更新或删除。',
    mode: 'owner',
    activeNav: 'owner',
    body: `${renderFlash(payload.flash)}${renderBatchModeForm({ items: payload.items, toolbarHtml: toolbar, contentHtml: cards, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly })}`
  });
}

export function renderOwnerSearchPage(payload) {
  const layout = payload.layout || 'rows';
  const sectionClass = layout === 'rows' ? 'cards list-rows' : 'cards';
  const renderFn = layout === 'rows' ? renderItemRow : renderItemCard;
  const toggleHref = buildLayoutToggleHref(`/web/search?q=${encodeURIComponent(payload.query || '')}${payload.missingLocalFileOnly ? '&missingLocalFileOnly=1' : ''}`, layout);
  const cards = payload.items.length > 0
    ? `<section class="${sectionClass}">${payload.items.map(renderFn).join('')}</section>`
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的内容。你可以调整关键词，或返回全部内容列表继续查看。</section>`;
  const toolbar = renderToolbar({ totalItems: payload.totalItems, page: payload.page, query: payload.query, missingLocalFileOnly: payload.missingLocalFileOnly, backHref: '/web/list', layout, toggleLayoutHref: toggleHref, ownerTools: true, batchAvailable: payload.items.length > 0 });

  return renderLayout({
    title: `Owner 搜索：${payload.query || '全部内容'}`,
    heading: 'Owner 搜索结果',
    description: payload.query ? `当前展示与“${payload.query}”相关的 owner 内容。` : '未提供关键词，显示默认结果。',
    mode: 'owner',
    activeNav: 'owner',
    query: payload.query,
    body: `${renderFlash(payload.flash)}${renderBatchModeForm({ items: payload.items, toolbarHtml: toolbar, contentHtml: cards, query: payload.query, page: payload.page, missingLocalFileOnly: payload.missingLocalFileOnly })}`
  });
}

export function renderPublicListPage(payload) {
  const layout = payload.layout || 'rows';
  const sectionClass = layout === 'rows' ? 'cards list-rows' : 'cards';
  const renderFn = layout === 'rows' ? renderPublicItemRow : renderPublicItemCard;
  const cards = payload.items.length > 0
    ? `<section class="${sectionClass}">${payload.items.map(renderFn).join('')}</section>`
    : '<section class="empty">当前还没有公开内容。</section>';

  return renderLayout({
    title: '公开内容列表',
    heading: '公开内容列表',
    description: '公开访客可以在这里浏览已经发布的文件与富文本，并继续进入详情页或下载原始文件。',
    mode: 'public',
    activeNav: 'public',
    eyebrow: 'Public Discovery',
    body: `${renderToolbar({ totalItems: payload.totalItems, page: payload.page, backHref: '/web/public/list', backLabel: '刷新公开列表', layout, toggleLayoutHref: `?layout=${layout === 'rows' ? 'cards' : 'rows'}` })}${cards}`
  });
}

export function renderPublicSearchPage(payload) {
  const layout = payload.layout || 'rows';
  const sectionClass = layout === 'rows' ? 'cards list-rows' : 'cards';
  const renderFn = layout === 'rows' ? renderPublicItemRow : renderPublicItemCard;
  const toggleHref = buildLayoutToggleHref(`/web/public/search?q=${encodeURIComponent(payload.query || '')}`, layout);
  const cards = payload.items.length > 0
    ? `<section class="${sectionClass}">${payload.items.map(renderFn).join('')}</section>`
    : `<section class="empty">没有匹配“${escapeHtml(payload.query)}”的公开内容。</section>`;

  return renderLayout({
    title: `公开搜索：${payload.query || '全部内容'}`,
    heading: '公开搜索结果',
    description: payload.query ? `当前展示与“${payload.query}”相关的公开内容。` : '未提供关键词，显示默认公开结果。',
    mode: 'public',
    activeNav: 'public',
    query: payload.query,
    eyebrow: 'Public Discovery',
    body: `${renderToolbar({ totalItems: payload.totalItems, page: payload.page, query: payload.query, backHref: '/web/public/list', backLabel: '返回公开列表', layout, toggleLayoutHref: toggleHref })}${cards}`
  });
}

export function renderOwnerDetailPage(detail) {
  const contentBlock = detail.type === 'rich_text'
    ? `<section class="panel preview-shell"><div class="badge-row"><span class="badge">${renderIcon('text')}${escapeHtml(detail.bodyFormat === 'markdown' ? 'Markdown 渲染预览' : 'HTML 预览')}</span></div><h3>${renderIcon('external')}最终展示预览</h3><iframe class="preview" title="内容预览" sandbox="${detail.bodyFormat === 'markdown' ? 'allow-scripts' : ''}" srcdoc="${buildPreviewSrcdoc(detail.renderedBodyHtml || detail.htmlContent || '', { enableMath: detail.bodyFormat === 'markdown' })}"></iframe></section>`
    : `<section class="panel"><h3>${renderIcon('file')}文件交付信息</h3><div class="meta-grid"><div><strong>文件名</strong><span>${escapeHtml(detail.originalFilename || '未提供')}</span></div><div><strong>MIME</strong><span>${escapeHtml(detail.mimeType || '-')}</span></div><div><strong>大小</strong><span>${escapeHtml(formatFileSize(detail.fileSize))}</span></div><div><strong>本地文件状态</strong><span>${detail.localFileExists === false ? renderIcon('warning') : renderIcon('check')}${escapeHtml(detail.localFileExists === false ? '本地文件缺失' : '文件存在')}</span></div><div><strong>文件访问</strong>${detail.isShared ? `<a class="supporting-link" href="/web/public/content/${encodeURIComponent(detail.contentHash)}">${renderIcon('external')}打开公开下载页</a>` : `<span class="muted">${renderIcon('lock')}未分享，无法公开下载。</span>`}</div></div>${detail.localFileExists === false ? '<p class="subtle-note">请重新上传或删除该记录，否则数据库记录与物理文件将持续不一致。</p>' : ''}</section>`;

  return renderLayout({
    title: detail.title || detail.originalFilename || 'Owner 内容详情',
    heading: detail.title || detail.originalFilename || 'Owner 内容详情',
    description: `内容类型：${detail.type === 'rich_text' ? '富文本' : '文件'}；当前状态：${detail.isShared ? '已公开' : '未公开'}。`,
    mode: 'owner',
    activeNav: 'owner',
    body: `${renderFlash(detail.flash)}<section class="toolbar"><div><strong>${renderIcon('shield')}单内容操作中心</strong><div class="muted">在这个页面完成查看、分享、撤销分享、更新和删除。</div></div><div class="action-row"><a class="btn secondary" href="/web/list">${renderIcon('arrow')}返回列表</a><a class="btn secondary" href="/web/credential">${renderIcon('key')}凭据与会话</a></div></section><section class="detail-layout"><div class="detail-main"><section class="panel"><h3>${renderIcon('list')}摘要</h3><div class="meta-grid"><div><strong>Content ID</strong><span>${escapeHtml(detail.contentId)}</span></div><div><strong>内容 Hash</strong><span>${escapeHtml(detail.contentHash)}</span></div><div><strong>Owner</strong><span>${escapeHtml(detail.ownerUserId)}</span></div><div><strong>共享状态</strong><span>${detail.isShared ? renderIcon('share') : renderIcon('lock')}${escapeHtml(detail.isShared ? '已分享' : '未分享')}</span></div><div><strong>访问模式</strong><span>${detail.accessMode === 'password' ? renderIcon('lock') : renderIcon('external')}${escapeHtml(detail.accessMode === 'password' ? 'password' : 'public')}</span></div></div></section>${contentBlock}</div><aside class="detail-side">${renderOwnerUpdatePanel(detail)}${renderOwnerActionPanel(detail)}</aside></section>`
  });
}

export function renderPublicContentPage(payload) {
  const body = payload.type === 'rich_text'
    ? `<section class="detail-layout"><div class="detail-main"><section class="panel preview-shell"><div class="badge-row"><span class="badge">${renderIcon('text')}${escapeHtml(payload.bodyFormat === 'markdown' ? '公开 Markdown 渲染内容' : '公开 HTML 内容')}</span></div><h2>${escapeHtml(payload.title || '未命名内容')}</h2><iframe class="preview" title="公开内容预览" sandbox="${payload.bodyFormat === 'markdown' ? 'allow-scripts' : ''}" srcdoc="${buildPreviewSrcdoc(payload.renderedBodyHtml || payload.htmlContent || '', { enableMath: payload.bodyFormat === 'markdown' })}"></iframe></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('external')}访问说明</h3><p>当前页面展示的是已公开富文本内容，外部访客无需登录即可查看。</p><div class="meta"><span>${renderIcon(payload.access === 'share_link' ? 'share' : 'external')}访问方式：${escapeHtml(payload.access === 'share_link' ? '分享链接' : '内容 hash')}</span><span>${renderIcon('text')}正文格式：${escapeHtml(payload.bodyFormat || 'html')}</span></div></section></aside></section>`
    : `<section class="detail-layout"><div class="detail-main"><section class="panel"><div class="badge-row"><span class="badge">${renderIcon('file')}公开文件</span></div><h2>${escapeHtml(payload.title || payload.originalFilename || '文件内容')}</h2><p>文件名：${escapeHtml(payload.download.filename)}</p><p>MIME：${escapeHtml(payload.download.mimeType)}</p><p><a class="btn" href="${escapeHtml(payload.publicApiUrl || payload.accessUrl)}">${renderIcon('download')}下载原始文件</a></p><p>该地址直接返回原始文件字节流，适合浏览器下载与外部系统拉取。</p></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('external')}访问说明</h3><div class="meta"><span>${renderIcon(payload.access === 'share_link' ? 'share' : 'external')}访问方式：${escapeHtml(payload.access === 'share_link' ? '分享链接' : '内容 hash')}</span><span>${renderIcon('file')}大小：${escapeHtml(formatFileSize(payload.fileSize))}</span></div></section></aside></section>`;

  return renderLayout({
    title: payload.title || payload.originalFilename || '公开访问',
    heading: '公开内容访问',
    description: '公开访客可以在此查看富文本内容，或下载 owner 发布的原始文件。',
    mode: 'public',
    activeNav: 'public',
    eyebrow: 'Public Delivery',
    body
  });
}

export function renderPublicPasswordPage({ access, hash, accessHint = null, message = '请输入访问密码' }) {
  const isShare = access === 'share_hash';
  const action = isShare
    ? `/web/public/share/${encodeURIComponent(hash)}/password`
    : `/web/public/content/${encodeURIComponent(hash)}/password`;
  const hasError = typeof message === 'string' && message.includes('错误');

  return renderLayout({
    title: '公开内容密码验证',
    heading: '公开内容密码验证',
    description: '该内容受密码保护，验证通过后可在短时间内继续访问。',
    mode: 'public',
    activeNav: 'public',
    eyebrow: 'Protected Access',
    body: `<section class="panel"><h3>${renderIcon('lock')}请输入访问密码</h3><p class="muted">${hasError ? '该内容受密码保护，请输入正确密码。' : escapeHtml(message)}</p>${accessHint ? `<p class="muted">提示：${escapeHtml(accessHint)}</p>` : ''}<form method="post" action="${escapeHtml(action)}" class="field-stack"><div class="field-stack"><label for="password"><strong>访问密码</strong></label><input id="password" type="password" name="password" required${hasError ? ' aria-describedby="password-error" aria-invalid="true"' : ''}>${hasError ? `<p class="field-error" id="password-error">${escapeHtml(message)}</p>` : ''}</div><div class="action-row"><button type="submit">${renderIcon('lock')}验证并访问</button></div></form></section>`
  });
}

export function renderErrorPage({ title, message, statusCode = 500 }) {
  return {
    statusCode,
    html: renderLayout({
      title,
      heading: title,
      description: '请求未能成功处理。',
      activeNav: 'owner',
      body: `<section class="error">${renderIcon('warning')}${escapeHtml(message)}</section>`
    })
  };
}

export function renderWriteFormPage({ flash } = {}) {
  return renderLayout({
    title: '写入新内容',
    heading: '写入新内容',
    description: '模拟 Agent 传入字符串，直接以 Markdown 形式写入内容库。',
    mode: 'owner',
    activeNav: 'write',
    body: `${renderFlash(flash)}<section class="detail-layout"><div class="detail-main"><section class="panel"><h3>${renderIcon('edit')}字符串写入</h3><form method="post" action="/web/write" class="field-stack"><div class="field-stack"><label for="title"><strong>标题</strong></label><input id="title" type="text" name="title" placeholder="输入内容标题" required></div><div class="field-stack"><label for="body"><strong>正文（Markdown）</strong></label><textarea id="body" name="body" rows="12" placeholder="在此编写 Markdown 正文..." required></textarea></div><div class="action-row"><button type="submit">${renderIcon('check')}写入内容库</button><a class="btn secondary" href="/web/list">${renderIcon('arrow')}返回列表</a></div></form></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('text')}说明</h3><p>本页面模拟了 Agent 通过 API 传入字符串主体的场景。</p><p>写入的内容将自动渲染 Markdown 为 HTML 并入库。</p><p>写入成功后会显示结果页，包含内容 ID 及查看链接。</p></section></aside></section>`
  });
}

export function renderWriteResultPage({ result, error } = {}) {
  if (error) {
    return {
      statusCode: 500,
      html: renderLayout({
        title: '写入失败',
        heading: '写入失败',
        description: '写入内容时发生错误。',
        mode: 'owner',
        activeNav: 'write',
        body: `<section class="error">${renderIcon('warning')}${escapeHtml(error.message || '写入内容时发生错误。')}</section><div class="action-row"><a class="btn secondary" href="/web/write">${renderIcon('refresh')}返回重试</a><a class="btn secondary" href="/web/list">${renderIcon('arrow')}返回列表</a></div>`
      })
    };
  }

  return renderLayout({
    title: '写入成功',
    heading: '写入成功',
    description: '内容已成功进入内容库。',
    mode: 'owner',
    activeNav: 'write',
    body: `<section class="detail-layout"><div class="detail-main"><section class="panel"><h3>${renderIcon('check')}创建结果</h3><div class="meta-grid"><div><strong>内容 ID</strong><span><code>${escapeHtml(result.contentId)}</code></span></div><div><strong>类型</strong><span>${renderIcon(result.type === 'rich_text' ? 'text' : 'file')}${escapeHtml(result.type)}</span></div><div><strong>内容哈希</strong><span><code>${escapeHtml(result.contentHash)}</code></span></div>${result.publicApiUrl ? `<div><strong>公开 API</strong><span><code>${escapeHtml(result.publicApiUrl)}</code></span></div>` : ''}</div></section></div><aside class="detail-side"><section class="panel"><h3>${renderIcon('external')}下一步</h3><div class="action-row"><a class="btn" href="/web/detail/${encodeURIComponent(result.contentId)}">${renderIcon('external')}查看详情页</a><a class="btn secondary" href="/web/write">${renderIcon('edit')}继续写入</a><a class="btn secondary" href="/web/list">${renderIcon('arrow')}返回列表</a></div></section></aside></section>`
  });
}
