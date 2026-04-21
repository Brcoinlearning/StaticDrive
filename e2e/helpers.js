import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function requireOk(response, label) {
  if (!response.ok) {
    throw new Error(label + ' failed: ' + response.status + ' ' + response.statusText);
  }
}

export function getFixturePdfPath() {
  return process.env.DEMO_PDF_PATH || path.join(rootDir, '2015-2016 第二学期 软件工程 期中试卷.pdf');
}

export function getDemoConfig() {
  return {
    baseUrl: process.env.E2E_BASE_URL || 'http://127.0.0.1:8787',
    apiHeader: process.env.DEMO_API_HEADER || 'x-shutong49-api-key',
    apiKey: process.env.DEMO_API_KEY || 't1_verify_api_key_0001'
  };
}

export async function ensureDemoData() {
  const config = getDemoConfig();
  const pdfPath = getFixturePdfPath();
  const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');
  const pdfFilename = path.basename(pdfPath);

  const healthResponse = await fetch(config.baseUrl + '/api/health');
  requireOk(healthResponse, 'service health');

  const uniqueSuffix = String(Date.now());
  const pdfTitle = '软件工程期中试卷 PDF 样例 ' + uniqueSuffix;
  const htmlTitle = '书童四九 HTML 样例 ' + uniqueSuffix;

  const headers = {
    'content-type': 'application/json',
    [config.apiHeader]: config.apiKey
  };

  const pdfWriteResponse = await fetch(config.baseUrl + '/api/write/file', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: pdfTitle,
      filename: pdfFilename,
      mimeType: 'application/pdf',
      contentBase64: pdfBase64
    })
  });
  requireOk(pdfWriteResponse, 'write file');
  const pdf = await pdfWriteResponse.json();

  const htmlWriteResponse = await fetch(config.baseUrl + '/api/write/html', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: htmlTitle,
      htmlContent: '<article><h1>静态网页服务演示</h1><p>这是人工演示的富文本样例。</p></article>'
    })
  });
  requireOk(htmlWriteResponse, 'write html');
  const html = await htmlWriteResponse.json();

  const pdfShareResponse = await fetch(config.baseUrl + '/api/write/share', {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentId: pdf.contentId })
  });
  requireOk(pdfShareResponse, 'share file');
  const pdfShare = await pdfShareResponse.json();

  const htmlShareResponse = await fetch(config.baseUrl + '/api/write/share', {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentId: html.contentId })
  });
  requireOk(htmlShareResponse, 'share html');
  const htmlShare = await htmlShareResponse.json();

  return {
    ...config,
    pdfPath,
    pdfTitle,
    htmlTitle,
    PDF_CONTENT_ID: pdf.contentId,
    PDF_CONTENT_HASH: pdf.contentHash,
    PDF_ACCESS_URL: pdf.accessUrl,
    PDF_SHARE_HASH: pdfShare.shareHash,
    PDF_SHARE_URL: pdfShare.shareUrl,
    HTML_CONTENT_ID: html.contentId,
    HTML_CONTENT_HASH: html.contentHash,
    HTML_ACCESS_URL: html.accessUrl,
    HTML_SHARE_HASH: htmlShare.shareHash,
    HTML_SHARE_URL: htmlShare.shareUrl
  };
}
