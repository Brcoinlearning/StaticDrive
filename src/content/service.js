import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';


const MAX_HASH_RETRIES = 5;


function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMarkdownInline(value) {
  let output = escapeHtml(value);
  const stashedHtml = [];

  function stash(html) {
    const token = `MDHTMLTOKEN${stashedHtml.length}ENDTOKEN`;
    stashedHtml.push(html);
    return token;
  }

  output = output.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_match, alt, src, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return stash(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${titleAttr}>`);
  });
  output = output.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_match, label, href, title) => {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return stash(`<a href="${escapeHtml(href)}"${titleAttr}>${renderMarkdownInline(label)}</a>`);
  });
  output = output.replace(/\$([^$\n]+)\$/g, (_match) => stash(`<span class="math-inline">${_match}</span>`));
  output = output.replace(/(^|[\s(\[])(https?:\/\/[^\s<>"']+)/g, (_match, prefix, rawHref) => {
    let href = rawHref;
    let trailing = '';
    while (/[),.!?;:。，“”！？；：]$/.test(href)) {
      trailing = href.slice(-1) + trailing;
      href = href.slice(0, -1);
    }
    if (!href) {
      return _match;
    }
    return `${prefix}${stash(`<a href="${escapeHtml(href)}">${escapeHtml(href)}</a>`)}${escapeHtml(trailing)}`;
  });
  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  output = output.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  output = output.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');
  return output.replace(/MDHTMLTOKEN(\d+)ENDTOKEN/g, (_match, index) => stashedHtml[Number(index)] ?? '');
}

function flushMarkdownParagraph(lines, blocks) {
  if (lines.length === 0) {
    return;
  }

  blocks.push(`<p>${lines.map((line) => renderMarkdownInline(line)).join('<br>')}</p>`);
  lines.length = 0;
}

function renderMarkdownListItem(item) {
  const taskMatch = item.text.match(/^\[([ xX])\]\s+(.*)$/);
  if (taskMatch) {
    const checked = taskMatch[1].toLowerCase() === 'x' ? ' checked' : '';
    const nested = item.children.map((list) => renderMarkdownList(list)).join('');
    return `<li><input type="checkbox" disabled${checked}> ${renderMarkdownInline(taskMatch[2].trim())}${nested}</li>`;
  }

  const nested = item.children.map((list) => renderMarkdownList(list)).join('');
  return `<li>${renderMarkdownInline(item.text)}${nested}</li>`;
}

function renderMarkdownList(list) {
  const tag = list.ordered ? 'ol' : 'ul';
  return `<${tag}>${list.items.map((item) => renderMarkdownListItem(item)).join('')}</${tag}>`;
}

function parseMarkdownListLine(line) {
  const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
  if (!match) {
    return null;
  }
  return {
    indent: match[1].replace(/\t/g, '    ').length,
    ordered: /\d+\./.test(match[2]),
    text: match[3].trim()
  };
}

function parseMarkdownListBlock(lines, startIndex) {
  let index = startIndex;
  let root = null;
  const stack = [];

  while (index < lines.length) {
    const parsed = parseMarkdownListLine(lines[index]);
    if (!parsed) {
      break;
    }

    const { indent, ordered, text } = parsed;

    while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
      stack.pop();
    }

    if (!root) {
      root = { ordered, items: [] };
      stack.push({ indent, list: root, lastItem: null });
    } else if (stack.length === 0) {
      break;
    }

    let current = stack[stack.length - 1];

    if (indent > current.indent) {
      if (!current.lastItem) {
        break;
      }
      const nestedList = { ordered, items: [] };
      current.lastItem.children.push(nestedList);
      current = { indent, list: nestedList, lastItem: null };
      stack.push(current);
    } else if (indent === current.indent && ordered !== current.list.ordered) {
      if (stack.length === 1) {
        break;
      }
      const parent = stack[stack.length - 2];
      if (!parent.lastItem) {
        break;
      }
      const siblingList = { ordered, items: [] };
      parent.lastItem.children.push(siblingList);
      current = { indent, list: siblingList, lastItem: null };
      stack[stack.length - 1] = current;
    }

    const item = { text, children: [] };
    current.list.items.push(item);
    current.lastItem = item;
    stack[stack.length - 1] = current;
    index += 1;
  }

  if (!root || root.items.length === 0) {
    return null;
  }

  return {
    html: renderMarkdownList(root),
    nextIndex: index - 1
  };
}

function renderMarkdownTable(lines) {
  if (lines.length < 2) {
    return null;
  }

  const splitRow = (line) => {
    const stripped = line.trim().replace(/^\||\|$/g, '');
    const cells = [];
    let current = '';
    let escaped = false;
    for (const ch of stripped) {
      if (escaped) {
        current += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '|') {
        cells.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    cells.push(current.trim());
    return cells;
  };
  const header = splitRow(lines[0]);
  const divider = splitRow(lines[1]);
  if (header.length === 0 || divider.length !== header.length || !divider.every((cell) => /^[\s:-]+$/.test(cell) && /-/.test(cell))) {
    return null;
  }

  const bodyRows = lines.slice(2).map(splitRow).filter((row) => row.length === header.length);
  return `<table><thead><tr>${header.map((cell) => `<th>${renderMarkdownInline(cell)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${renderMarkdownInline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function defaultMarkdownRenderer(markdown) {
  if (typeof markdown !== 'string') {
    const error = new Error('Markdown body must be a string.');
    error.statusCode = 400;
    error.code = 'invalid_markdown_payload';
    throw error;
  }

  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    const error = new Error('Markdown body is required.');
    error.statusCode = 400;
    error.code = 'invalid_markdown_payload';
    throw error;
  }

  const lines = normalized.split('\n');
  const blocks = [];
  const paragraphLines = [];
  let inCodeBlock = false;
  let codeLines = [];
  let codeLanguage = '';

  function flushCurrentTextState() {
    flushMarkdownParagraph(paragraphLines, blocks);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushCurrentTextState();
      if (inCodeBlock) {
        const classAttr = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        blocks.push(`<pre><code${classAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeLines = [];
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushCurrentTextState();
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushCurrentTextState();
      blocks.push('<hr>');
      continue;
    }

    if (trimmed === '$$') {
      flushCurrentTextState();
      const formulaLines = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== '$$') {
        formulaLines.push(lines[index]);
        index += 1;
      }
      blocks.push(`<div class="math-block">$$${escapeHtml(formulaLines.join('\n').trim())}$$</div>`);
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushCurrentTextState();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderMarkdownInline(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushCurrentTextState();
      const quoteLines = [quoteMatch[1].trim()];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const nextMatch = lines[cursor].trim().match(/^>\s?(.*)$/);
        if (!nextMatch) {
          break;
        }
        quoteLines.push(nextMatch[1].trim());
        cursor += 1;
      }
      blocks.push(`<blockquote><p>${quoteLines.map((value) => renderMarkdownInline(value)).join('<br>')}</p></blockquote>`);
      index = cursor - 1;
      continue;
    }

    const listBlock = parseMarkdownListBlock(lines, index);
    if (listBlock) {
      flushCurrentTextState();
      blocks.push(listBlock.html);
      index = listBlock.nextIndex;
      continue;
    }

    if (trimmed.includes('|') && index + 1 < lines.length && lines[index + 1].trim().includes('|')) {
      const candidate = [trimmed, lines[index + 1].trim()];
      let cursor = index + 2;
      while (cursor < lines.length && lines[cursor].trim().includes('|') && lines[cursor].trim() !== '') {
        candidate.push(lines[cursor].trim());
        cursor += 1;
      }
      const tableHtml = renderMarkdownTable(candidate);
      if (tableHtml) {
        flushCurrentTextState();
        blocks.push(tableHtml);
        index = cursor - 1;
        continue;
      }
    }

    paragraphLines.push(trimmed);
  }

  if (inCodeBlock) {
    const classAttr = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    blocks.push(`<pre><code${classAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  flushMarkdownParagraph(paragraphLines, blocks);
  return blocks.join('');
}

function buildRenderedContent({ body, bodyFormat, markdownRenderer }) {
  if (bodyFormat === 'html') {
    return {
      body,
      bodyFormat: 'html',
      renderedBodyHtml: body
    };
  }

  if (bodyFormat === 'markdown') {
    try {
      return {
        body,
        bodyFormat: 'markdown',
        renderedBodyHtml: markdownRenderer(body)
      };
    } catch (error) {
      if (error?.statusCode && error?.code) {
        throw error;
      }

      const wrappedError = new Error('Markdown rendering failed.');
      wrappedError.statusCode = 400;
      wrappedError.code = 'invalid_markdown_payload';
      wrappedError.cause = error;
      throw wrappedError;
    }
  }

  const error = new Error('bodyFormat must be html or markdown.');
  error.statusCode = 400;
  error.code = 'invalid_content_payload';
  throw error;
}

function buildPublicPageUrl(config, contentHash) {
  const baseUrl = config.publicBaseUrl || `http://${config.serviceHost}:${config.servicePort}`;
  return `${baseUrl}/web/public/content/${encodeURIComponent(contentHash)}`;
}

function buildPublicApiUrl(config, contentHash) {
  const baseUrl = config.publicBaseUrl || `http://${config.serviceHost}:${config.servicePort}`;
  return `${baseUrl}/api/public/content/${contentHash}`;
}

function buildSharePageUrl(config, shareHash) {
  const baseUrl = config.publicBaseUrl || `http://${config.serviceHost}:${config.servicePort}`;
  return `${baseUrl}/web/public/share/${encodeURIComponent(shareHash)}`;
}

function buildShareApiUrl(config, shareHash) {
  const baseUrl = config.publicBaseUrl || `http://${config.serviceHost}:${config.servicePort}`;
  return `${baseUrl}/api/public/share/${shareHash}`;
}

function normalizeTitle(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeSearch(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim();
}

function stripHtmlToText(value) {
  if (typeof value !== 'string' || !value) {
    return '';
  }

  return value
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function truncateSummary(text, maxLen = 120) {
  if (typeof text !== 'string' || text.length <= maxLen) {
    return text || '';
  }

  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + ' ...';
}

function resolveAuthorName(record) {
  const displayName = record?.expand?.owner_user_id?.display_name;
  if (typeof displayName !== 'string') {
    return null;
  }

  const normalized = displayName.trim();
  return normalized || null;
}

function buildRichTextStorageFields({ body, bodyFormat, renderedBodyHtml }) {
  return {
    body_source: body,
    body_format: bodyFormat,
    html_content: renderedBodyHtml
  };
}

function buildRichTextView(record) {
  const renderedBodyHtml = record.type === 'rich_text' ? record.html_content ?? '' : '';
  const bodyFormat = record.type === 'rich_text'
    ? ((typeof record.body_format === 'string' && record.body_format.trim()) ? record.body_format.trim() : 'html')
    : null;
  const body = record.type === 'rich_text'
    ? ((typeof record.body_source === 'string') ? record.body_source : renderedBodyHtml)
    : '';

  return {
    body,
    bodyFormat,
    renderedBodyHtml,
    htmlContent: renderedBodyHtml
  };
}

function buildContentObjectFields(record) {
  const richTextView = buildRichTextView(record);
  return {
    body: richTextView.body,
    bodyFormat: richTextView.bodyFormat,
    renderedBodyHtml: richTextView.renderedBodyHtml,
    htmlContent: richTextView.htmlContent,
    authorName: resolveAuthorName(record),
    createdAt: record.created,
    summary: richTextView.renderedBodyHtml ? truncateSummary(stripHtmlToText(richTextView.renderedBodyHtml)) : ''
  };
}

function normalizeBatchContentIds(contentIds) {
  if (!Array.isArray(contentIds)) {
    const error = new Error('contentIds must be an array.');
    error.statusCode = 400;
    error.code = 'invalid_batch_payload';
    throw error;
  }

  const normalized = [];
  const seen = new Set();
  for (const value of contentIds) {
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }

    const next = value.trim();
    if (!seen.has(next)) {
      seen.add(next);
      normalized.push(next);
    }
  }

  if (normalized.length === 0) {
    const error = new Error('At least one contentId is required.');
    error.statusCode = 400;
    error.code = 'invalid_batch_payload';
    throw error;
  }

  return normalized;
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeBooleanFlag(value) {
  return value === true || value === '1' || value === 'true' || value === 'on';
}

function buildContentSummary(config, record) {
  return {
    contentId: record.id,
    type: record.type,
    title: record.title,
    ...buildContentObjectFields(record),
    originalFilename: record.original_filename,
    contentHash: record.content_hash,
    accessUrl: buildPublicPageUrl(config, record.content_hash),
    publicApiUrl: buildPublicApiUrl(config, record.content_hash),
    mimeType: record.mime_type,
    fileSize: record.file_size,
    localFileExists: record.type === 'file' ? record.local_file_exists !== false : true,
    isShared: record.is_shared,
    updatedAt: record.updated
  };
}

function buildPublicContentSummary(config, record) {
  return {
    contentId: record.id,
    type: record.type,
    title: record.title,
    originalFilename: record.original_filename,
    contentHash: record.content_hash,
    accessUrl: buildPublicPageUrl(config, record.content_hash),
    publicApiUrl: buildPublicApiUrl(config, record.content_hash),
    publicPageUrl: `/web/public/content/${encodeURIComponent(record.content_hash)}`,
    mimeType: record.mime_type,
    fileSize: record.file_size,
    createdAt: record.created,
    updatedAt: record.updated,
    bodyFormat: record.body_format || 'html',
    summary: truncateSummary(stripHtmlToText(record.html_content || ''))
  };
}

function buildContentDetail(config, record) {
  return {
    ...buildContentSummary(config, record),
    ownerUserId: record.owner_user_id,
    storagePath: record.storage_path
  };
}

function sanitizeFileName(value) {
  const fallback = 'upload.bin';
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return path.basename(trimmed).replace(/[\u0000-\u001f]/g, '_');
}

function decodeBase64File(contentBase64) {
  if (typeof contentBase64 !== 'string' || !contentBase64.trim()) {
    const error = new Error('contentBase64 is required.');
    error.statusCode = 400;
    error.code = 'invalid_file_payload';
    throw error;
  }

  const normalized = contentBase64.replace(/\s+/g, '');
  if (!normalized || normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    const error = new Error('contentBase64 must be valid base64.');
    error.statusCode = 400;
    error.code = 'invalid_file_payload';
    throw error;
  }

  return Buffer.from(normalized, 'base64');
}

function isHashConflict(error) {
  const payload = error?.payload;
  if (error?.status !== 400 || (!payload?.data?.content_hash && !payload?.data?.share_hash)) {
    return false;
  }

  return true;
}

function isRecordNotFound(error) {
  return error?.status === 404 || error?.diagnostic?.pocketbaseStatus === 404;
}

async function createContentWithRetry(createRecord) {
  let attempt = 0;

  while (attempt < MAX_HASH_RETRIES) {
    try {
      return await createRecord();
    } catch (error) {
      attempt += 1;
      if (!isHashConflict(error) || attempt >= MAX_HASH_RETRIES) {
        throw error;
      }
    }
  }

  throw new Error('Unable to generate unique content hash.');
}

async function withLocalFileState(fsImpl, storageRoot, record) {
  if (!record || record.type !== 'file') {
    return {
      ...record,
      local_file_exists: true
    };
  }

  const storagePath = typeof record.storage_path === 'string' ? record.storage_path.trim() : '';
  if (!storagePath) {
    return {
      ...record,
      local_file_exists: false
    };
  }

  try {
    await fsImpl.access(path.join(storageRoot, storagePath));
    return {
      ...record,
      local_file_exists: true
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        ...record,
        local_file_exists: false
      };
    }

    throw error;
  }
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function removeFileIfExists(fsImpl, filePath) {
  try {
    await fsImpl.rm(filePath, { force: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

function buildPublicHtmlPayload(config, record, access) {
  const richTextView = buildRichTextView(record);
  return {
    access,
    contentId: record.id,
    type: 'rich_text',
    title: record.title,
    contentHash: record.content_hash,
    mimeType: record.mime_type,
    body: richTextView.body,
    bodyFormat: richTextView.bodyFormat,
    renderedBodyHtml: richTextView.renderedBodyHtml,
    htmlContent: richTextView.htmlContent,
    accessUrl: buildPublicPageUrl(config, record.content_hash),
    publicApiUrl: buildPublicApiUrl(config, record.content_hash)
  };
}

function buildPublicFilePayload(config, record, fileContent, access) {
  return {
    access,
    contentId: record.id,
    type: 'file',
    title: record.title,
    originalFilename: record.original_filename,
    contentHash: record.content_hash,
    mimeType: record.mime_type,
    fileSize: record.file_size,
    accessUrl: buildPublicPageUrl(config, record.content_hash),
    publicApiUrl: buildPublicApiUrl(config, record.content_hash),
    download: {
      filename: record.original_filename,
      mimeType: record.mime_type
    },
    fileContent
  };
}

export function createContentService({ config, pocketbaseClient, fsImpl = fs, markdownRenderer = defaultMarkdownRenderer }) {
  const storageRoot = path.join(config.workspaceDir, 'content-files');

  async function readStoredFile(storagePath) {
    if (typeof storagePath !== 'string' || !storagePath.trim()) {
      const error = new Error('Stored file path is missing.');
      error.statusCode = 500;
      error.code = 'storage_path_missing';
      throw error;
    }

    try {
      return await fsImpl.readFile(path.join(storageRoot, storagePath));
    } catch (error) {
      if (error?.code === 'ENOENT') {
        const missingError = new Error('Stored file is missing.');
        missingError.statusCode = 404;
        missingError.code = 'file_not_found';
        throw missingError;
      }

      throw error;
    }
  }

  async function ensureOwnedContent(ownerUserId, contentId) {
    if (typeof contentId !== 'string' || !contentId.trim()) {
      const error = new Error('contentId is required.');
      error.statusCode = 400;
      error.code = 'invalid_query_payload';
      throw error;
    }

    try {
      const record = await pocketbaseClient.getContentById(contentId.trim());
      if (record.owner_user_id !== ownerUserId) {
        const error = new Error('You cannot access content owned by another user.');
        error.statusCode = 403;
        error.code = 'content_forbidden';
        throw error;
      }

      return record;
    } catch (error) {
      if (isRecordNotFound(error)) {
        const notFoundError = new Error('Content not found.');
        notFoundError.statusCode = 404;
        notFoundError.code = 'content_not_found';
        throw notFoundError;
      }

      throw error;
    }
  }

  async function createHtmlContent({ ownerUserId, title, htmlContent, body, bodyFormat }) {
    const normalizedTitle = normalizeTitle(title);
    const normalizedBodyFormat = bodyFormat === undefined || bodyFormat === null || bodyFormat === ''
      ? 'html'
      : bodyFormat;
    const inputBody = body !== undefined ? body : htmlContent;

    if (typeof inputBody !== 'string') {
      const error = new Error('body must be a string.');
      error.statusCode = 400;
      error.code = normalizedBodyFormat === 'html' ? 'invalid_html_payload' : 'invalid_content_payload';
      throw error;
    }

    if (!inputBody.trim()) {
      const error = new Error('body is required for rich text content.');
      error.statusCode = 400;
      error.code = normalizedBodyFormat === 'html' ? 'invalid_html_payload' : 'invalid_content_payload';
      throw error;
    }

    const renderedContent = buildRenderedContent({
      body: inputBody,
      bodyFormat: normalizedBodyFormat,
      markdownRenderer
    });
    const richTextStorage = buildRichTextStorageFields(renderedContent);

    const { contentHash, record } = await createContentWithRetry(async () => {
      const nextContentHash = crypto.randomBytes(16).toString('hex');
      const nextRecord = await pocketbaseClient.createContent({
        owner_user_id: ownerUserId,
        type: 'rich_text',
        title: normalizedTitle,
        original_filename: '',
        content_hash: nextContentHash,
        storage_path: '',
        mime_type: 'text/html',
        file_size: 0,
        ...richTextStorage,
        is_shared: false
      });

      return { contentHash: nextContentHash, record: nextRecord };
    });

    return {
      contentId: record.id,
      type: 'rich_text',
      contentHash,
      accessUrl: buildPublicPageUrl(config, contentHash),
      publicApiUrl: buildPublicApiUrl(config, contentHash)
    };
  }

  async function createFileContent({ ownerUserId, title, filename, mimeType, contentBase64 }) {
    const fileBuffer = decodeBase64File(contentBase64);
    const safeFilename = sanitizeFileName(filename);
    const normalizedTitle = normalizeTitle(title) || safeFilename;

    const { contentHash, record } = await createContentWithRetry(async () => {
      const nextContentHash = crypto.randomBytes(16).toString('hex');
      const relativeStoragePath = path.join(nextContentHash.slice(0, 2), `${nextContentHash}-${safeFilename}`);
      const absoluteStoragePath = path.join(storageRoot, relativeStoragePath);

      await ensureDirectory(path.dirname(absoluteStoragePath));
      await fsImpl.writeFile(absoluteStoragePath, fileBuffer);

      try {
        const nextRecord = await pocketbaseClient.createContent({
          owner_user_id: ownerUserId,
          type: 'file',
          title: normalizedTitle,
          original_filename: safeFilename,
          content_hash: nextContentHash,
          storage_path: relativeStoragePath,
          mime_type: typeof mimeType === 'string' && mimeType.trim() ? mimeType.trim() : 'application/octet-stream',
          file_size: fileBuffer.byteLength,
          html_content: '',
          is_shared: false
        });

        return { contentHash: nextContentHash, record: nextRecord };
      } catch (error) {
        await removeFileIfExists(fsImpl, absoluteStoragePath);
        throw error;
      }
    });

    return {
      contentId: record.id,
      type: 'file',
      contentHash,
      accessUrl: buildPublicPageUrl(config, contentHash),
      publicApiUrl: buildPublicApiUrl(config, contentHash)
    };
  }

  async function listContents({ ownerUserId, page, perPage, missingLocalFileOnly }) {
    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedPerPage = normalizePositiveInteger(perPage, 20);
    const missingOnly = normalizeBooleanFlag(missingLocalFileOnly);
    const payload = await pocketbaseClient.listContents({
      ownerUserId,
      page: normalizedPage,
      perPage: normalizedPerPage,
      search: ''
    });

    const items = await Promise.all((payload.items ?? []).map((record) => withLocalFileState(fsImpl, storageRoot, record)));

    const visibleItems = missingOnly
      ? items.filter((record) => record.type === 'file' && record.local_file_exists === false)
      : items;

    return {
      items: visibleItems.map((record) => buildContentSummary(config, record)),
      page: payload.page ?? normalizedPage,
      perPage: payload.perPage ?? normalizedPerPage,
      totalItems: missingOnly ? visibleItems.length : (payload.totalItems ?? 0),
      totalPages: missingOnly ? (visibleItems.length > 0 ? 1 : 0) : (payload.totalPages ?? 0),
      missingLocalFileOnly: missingOnly
    };
  }

  async function searchContents({ ownerUserId, q, page, perPage, missingLocalFileOnly }) {
    const normalizedQuery = normalizeSearch(q);
    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedPerPage = normalizePositiveInteger(perPage, 20);
    const missingOnly = normalizeBooleanFlag(missingLocalFileOnly);
    const payload = await pocketbaseClient.listContents({
      ownerUserId,
      page: normalizedPage,
      perPage: normalizedPerPage,
      search: normalizedQuery
    });

    const items = await Promise.all((payload.items ?? []).map((record) => withLocalFileState(fsImpl, storageRoot, record)));

    const visibleItems = missingOnly
      ? items.filter((record) => record.type === 'file' && record.local_file_exists === false)
      : items;

    return {
      query: normalizedQuery,
      items: visibleItems.map((record) => buildContentSummary(config, record)),
      page: payload.page ?? normalizedPage,
      perPage: payload.perPage ?? normalizedPerPage,
      totalItems: missingOnly ? visibleItems.length : (payload.totalItems ?? 0),
      totalPages: missingOnly ? (visibleItems.length > 0 ? 1 : 0) : (payload.totalPages ?? 0),
      missingLocalFileOnly: missingOnly
    };
  }

  async function getContentDetail({ ownerUserId, contentId }) {
    const ownedRecord = await ensureOwnedContent(ownerUserId, contentId);
    const record = await withLocalFileState(fsImpl, storageRoot, ownedRecord);
    return buildContentDetail(config, record);
  }

  async function updateContent({ ownerUserId, contentId, title, htmlContent, body, bodyFormat }) {
    const record = await ensureOwnedContent(ownerUserId, contentId);
    const nextTitle = normalizeOptionalString(title);
    const updateRecord = {};

    if (nextTitle !== null) {
      if (!nextTitle) {
        const error = new Error('title cannot be empty.');
        error.statusCode = 400;
        error.code = 'invalid_update_payload';
        throw error;
      }
      updateRecord.title = nextTitle;
    }

    const nextBodyFormat = bodyFormat === undefined || bodyFormat === null || bodyFormat === ''
      ? undefined
      : bodyFormat;
    const nextBody = body !== undefined ? body : htmlContent;

    if (nextBody !== undefined || nextBodyFormat !== undefined) {
      if (record.type !== 'rich_text') {
        const error = new Error('Only rich text content supports body/htmlContent updates.');
        error.statusCode = 400;
        error.code = 'invalid_update_payload';
        throw error;
      }

      const effectiveBodyFormat = nextBodyFormat ?? (typeof record.body_format === 'string' && record.body_format.trim()
        ? record.body_format.trim()
        : 'html');
      const effectiveBody = nextBody !== undefined
        ? nextBody
        : (typeof record.body_source === 'string' ? record.body_source : (record.html_content ?? ''));

      if (typeof effectiveBody !== 'string') {
        const error = new Error('body must be a string.');
        error.statusCode = 400;
        error.code = 'invalid_update_payload';
        throw error;
      }

      if (!effectiveBody.trim()) {
        const error = new Error('body is required for rich text content.');
        error.statusCode = 400;
        error.code = 'invalid_update_payload';
        throw error;
      }

      let renderedContent;
      try {
        renderedContent = buildRenderedContent({
          body: effectiveBody,
          bodyFormat: effectiveBodyFormat,
          markdownRenderer
        });
      } catch (error) {
        error.statusCode = 400;
        error.code = 'invalid_update_payload';
        throw error;
      }

      Object.assign(updateRecord, buildRichTextStorageFields(renderedContent));
    }

    if (Object.keys(updateRecord).length === 0) {
      const error = new Error('No updatable fields were provided.');
      error.statusCode = 400;
      error.code = 'invalid_update_payload';
      throw error;
    }

    const updatedRecord = await pocketbaseClient.updateContent(record.id, updateRecord);
    return buildContentDetail(config, updatedRecord);
  }

  async function listPublicContents({ page, perPage }) {
    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedPerPage = normalizePositiveInteger(perPage, 20);
    const payload = await pocketbaseClient.listPublicContents({
      page: normalizedPage,
      perPage: normalizedPerPage,
      search: ''
    });

    return {
      items: (payload.items ?? []).map((record) => buildPublicContentSummary(config, record)),
      page: payload.page ?? normalizedPage,
      perPage: payload.perPage ?? normalizedPerPage,
      totalItems: payload.totalItems ?? 0,
      totalPages: payload.totalPages ?? 0
    };
  }

  async function searchPublicContents({ q, page, perPage }) {
    const normalizedQuery = normalizeSearch(q);
    const normalizedPage = normalizePositiveInteger(page, 1);
    const normalizedPerPage = normalizePositiveInteger(perPage, 20);
    const payload = await pocketbaseClient.listPublicContents({
      page: normalizedPage,
      perPage: normalizedPerPage,
      search: normalizedQuery
    });

    return {
      query: normalizedQuery,
      items: (payload.items ?? []).map((record) => buildPublicContentSummary(config, record)),
      page: payload.page ?? normalizedPage,
      perPage: payload.perPage ?? normalizedPerPage,
      totalItems: payload.totalItems ?? 0,
      totalPages: payload.totalPages ?? 0
    };
  }

  async function revokeShareLink({ ownerUserId, contentId }) {
    const record = await ensureOwnedContent(ownerUserId, contentId);
    const activeShareLink = await pocketbaseClient.findShareLinkByContentId(record.id);

    if (!activeShareLink) {
      const error = new Error('Active share link not found.');
      error.statusCode = 404;
      error.code = 'share_not_found';
      throw error;
    }

    await pocketbaseClient.updateShareLink(activeShareLink.id, { is_revoked: true });
    await pocketbaseClient.updateContent(record.id, { is_shared: false });

    return {
      contentId: record.id,
      shareId: activeShareLink.id,
      shareHash: activeShareLink.share_hash,
      revoked: true
    };
  }

  async function deleteContent({ ownerUserId, contentId }) {
    const record = await ensureOwnedContent(ownerUserId, contentId);
    const shareLinks = await pocketbaseClient.listShareLinksByContentId(record.id, { includeRevoked: true });
    const absoluteStoragePath = record.type === 'file' && record.storage_path
      ? path.join(storageRoot, record.storage_path)
      : null;

    for (const shareLink of shareLinks) {
      if (!shareLink.is_revoked) {
        await pocketbaseClient.updateShareLink(shareLink.id, { is_revoked: true });
      }
    }

    if (absoluteStoragePath) {
      await removeFileIfExists(fsImpl, absoluteStoragePath);
    }

    try {
      await pocketbaseClient.deleteContent(record.id);
    } catch (error) {
      if (absoluteStoragePath) {
        const rollbackError = new Error('Content delete failed after physical file removal.');
        rollbackError.statusCode = 500;
        rollbackError.code = 'content_delete_inconsistent';
        rollbackError.cause = error;
        throw rollbackError;
      }

      throw error;
    }

    return {
      contentId: record.id,
      deleted: true,
      revokedShareCount: shareLinks.length,
      removedFile: Boolean(absoluteStoragePath)
    };
  }

  async function batchOperateContents({ ownerUserId, action, contentIds }) {
    const normalizedAction = typeof action === 'string' ? action.trim() : '';
    const normalizedContentIds = normalizeBatchContentIds(contentIds);

    if (!['share', 'share_revoke', 'delete', 'cleanup_missing_file_records'].includes(normalizedAction)) {
      const error = new Error('Unsupported batch action.');
      error.statusCode = 400;
      error.code = 'invalid_batch_payload';
      throw error;
    }

    const results = [];
    for (const contentId of normalizedContentIds) {
      if (normalizedAction === 'share') {
        const result = await createShareLink({ ownerUserId, contentId });
        results.push({
          contentId,
          action: normalizedAction,
          status: 'success',
          shareHash: result.shareHash,
          contentHash: result.contentHash
        });
        continue;
      }

      if (normalizedAction === 'share_revoke') {
        const result = await revokeShareLink({ ownerUserId, contentId });
        results.push({
          contentId,
          action: normalizedAction,
          status: 'success',
          revoked: result.revoked,
          shareHash: result.shareHash
        });
        continue;
      }

      if (normalizedAction === 'cleanup_missing_file_records') {
        const ownedRecord = await ensureOwnedContent(ownerUserId, contentId);
        const record = await withLocalFileState(fsImpl, storageRoot, ownedRecord);
        if (record.type !== 'file' || record.local_file_exists !== false) {
          continue;
        }

        const result = await deleteContent({ ownerUserId, contentId });
        results.push({
          contentId,
          action: normalizedAction,
          status: 'success',
          deleted: result.deleted,
          removedFile: result.removedFile
        });
        continue;
      }

      const result = await deleteContent({ ownerUserId, contentId });
      results.push({
        contentId,
        action: normalizedAction,
        status: 'success',
        deleted: result.deleted,
        removedFile: result.removedFile
      });
    }

    return {
      action: normalizedAction,
      totalCount: normalizedContentIds.length,
      succeededCount: results.length,
      results
    };
  }

  async function createShareLink({ ownerUserId, contentId }) {
    const record = await ensureOwnedContent(ownerUserId, contentId);
    const existingShareLink = await pocketbaseClient.findShareLinkByContentId(record.id);

    if (existingShareLink) {
      if (!record.is_shared) {
        await pocketbaseClient.updateContent(record.id, { is_shared: true });
      }

      return {
        contentId: record.id,
        contentHash: record.content_hash,
        shareId: existingShareLink.id,
        shareHash: existingShareLink.share_hash,
        shareUrl: buildSharePageUrl(config, existingShareLink.share_hash),
        shareApiUrl: buildShareApiUrl(config, existingShareLink.share_hash),
        accessUrl: buildPublicPageUrl(config, record.content_hash),
        publicApiUrl: buildPublicApiUrl(config, record.content_hash),
        type: record.type
      };
    }

    const { shareHash, shareLink } = await createContentWithRetry(async () => {
      const nextShareHash = crypto.randomBytes(16).toString('hex');
      const nextShareLink = await pocketbaseClient.createShareLink({
        content_id: record.id,
        share_hash: nextShareHash,
        is_revoked: false
      });

      return { shareHash: nextShareHash, shareLink: nextShareLink };
    });

    if (!record.is_shared) {
      await pocketbaseClient.updateContent(record.id, { is_shared: true });
    }

    return {
      contentId: record.id,
      contentHash: record.content_hash,
      shareId: shareLink.id,
      shareHash,
      shareUrl: buildSharePageUrl(config, shareHash),
      shareApiUrl: buildShareApiUrl(config, shareHash),
      accessUrl: buildPublicPageUrl(config, record.content_hash),
      publicApiUrl: buildPublicApiUrl(config, record.content_hash),
      type: record.type
    };
  }

  async function getPublicContentByHash(contentHash) {
    if (typeof contentHash !== 'string' || !contentHash.trim()) {
      const error = new Error('contentHash is required.');
      error.statusCode = 400;
      error.code = 'invalid_public_hash';
      throw error;
    }

    const record = await pocketbaseClient.getContentByHash(contentHash.trim());
    if (!record) {
      const error = new Error('Content not found.');
      error.statusCode = 404;
      error.code = 'content_not_found';
      throw error;
    }

    if (!record.is_shared) {
      const error = new Error('Content is not shared.');
      error.statusCode = 403;
      error.code = 'content_not_shared';
      throw error;
    }

    if (record.type === 'rich_text') {
      return buildPublicHtmlPayload(config, record, 'content_hash');
    }

    const fileContent = await readStoredFile(record.storage_path);
    return buildPublicFilePayload(config, record, fileContent, 'content_hash');
  }

  async function getPublicContentByShareHash(shareHash) {
    if (typeof shareHash !== 'string' || !shareHash.trim()) {
      const error = new Error('shareHash is required.');
      error.statusCode = 400;
      error.code = 'invalid_share_hash';
      throw error;
    }

    const shareLink = await pocketbaseClient.findShareLinkByHash(shareHash.trim());
    if (!shareLink) {
      const error = new Error('Share link not found.');
      error.statusCode = 404;
      error.code = 'share_not_found';
      throw error;
    }

    if (shareLink.is_revoked) {
      const error = new Error('Share link has been revoked.');
      error.statusCode = 410;
      error.code = 'share_revoked';
      throw error;
    }

    const record = await pocketbaseClient.getContentById(shareLink.content_id);
    if (!record) {
      const error = new Error('Content not found.');
      error.statusCode = 404;
      error.code = 'content_not_found';
      throw error;
    }

    if (record.type === 'rich_text') {
      return buildPublicHtmlPayload(config, record, 'share_hash');
    }

    const fileContent = await readStoredFile(record.storage_path);
    return buildPublicFilePayload(config, record, fileContent, 'share_hash');
  }

  return {
    createHtmlContent,
    createFileContent,
    listContents,
    searchContents,
    getContentDetail,
    updateContent,
    batchOperateContents,
    listPublicContents,
    searchPublicContents,
    createShareLink,
    revokeShareLink,
    deleteContent,
    getPublicContentByHash,
    getPublicContentByShareHash
  };
}
