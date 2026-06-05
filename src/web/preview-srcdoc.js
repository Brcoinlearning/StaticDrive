import { escapeHtml } from './html-utils.js';

export function buildPreviewSrcdoc(html, options = {}) {
  const contentHtml = html || '';
  const enableMath = options.enableMath === true && /math-inline|math-block/.test(contentHtml);
  const mathStyles = enableMath
    ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">'
    : '';
  const mathScripts = enableMath
    ? '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script><script>window.addEventListener("DOMContentLoaded",()=>{if(window.renderMathInElement){window.renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}]});}});</script>'
    : '';
  const previewHtml = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:28px;color:#17212f;font:16px/1.72 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;}img{max-width:100%;height:auto;display:block;margin:18px auto;border-radius:10px;}p{margin:0 0 1em;}h1,h2,h3,h4,h5,h6{margin:1.25em 0 .55em;line-height:1.24;color:#101828;text-wrap:balance;}ul,ol{padding-left:1.4rem;margin:0 0 1em;}blockquote{margin:1.2em 0;padding:14px 16px;border:1px solid #d8e0e8;background:#f6f8fb;border-radius:10px;color:#2d3a4a;}pre{overflow:auto;padding:16px;border-radius:10px;background:#101828;color:#eef3f7;border:1px solid #263244;}code{font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:.92em;}body :not(pre)>code{background:#eef3f7;padding:2px 6px;border-radius:5px;color:#0b5159;}table{width:100%;border-collapse:collapse;margin:1.2em 0;font-size:.95rem;}th,td{border:1px solid #d8e0e8;padding:10px 12px;vertical-align:top;}th{background:#f6f8fb;text-align:left;color:#101828;}hr{border:0;border-top:1px solid #d8e0e8;margin:1.5em 0;}.math-inline{display:inline;}.math-block{display:block;margin:1.2em 0;padding:14px 16px;border:1px solid #d8e0e8;border-radius:10px;white-space:pre-wrap;overflow:auto;background:#f9fafb;}li input[type="checkbox"]{margin-right:.5em;vertical-align:middle;accent-color:#116a74;}.katex-display{overflow:auto;overflow-y:hidden;padding:.2rem 0;}a{color:#0b5159;text-decoration-thickness:1px;text-underline-offset:3px;}a:hover{color:#116a74;}@media(max-width:640px){body{padding:18px;font-size:15px;}}</style>' + mathStyles + '</head><body>' + contentHtml + mathScripts + '</body></html>';
  return escapeHtml(previewHtml);
}
