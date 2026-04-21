import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { ensureDemoData, getFixturePdfPath } from './helpers.js';

let demoState;

test.beforeAll(async () => {
  demoState = await ensureDemoData();
});

test('owner can login, inspect content, and manage share state', async ({ page }) => {
  await page.goto('/web/auth/login');
  await expect(page.getByRole('heading', { name: '进入 Owner 控制台' })).toBeVisible();

  await page.getByLabel('API Key').fill(demoState.apiKey);
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/web\/list/);
  await expect(page.getByText('登录成功')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Owner 内容列表' })).toBeVisible();
  const pdfLink = page.getByRole('link', { name: demoState.pdfTitle });
  await expect(pdfLink).toBeVisible();

  await pdfLink.click();
  await expect(page).toHaveURL(new RegExp(`/web/detail/${demoState.PDF_CONTENT_ID}(?:\\?.*)?$`));
  await expect(page.getByText('单内容操作中心')).toBeVisible();
  await expect(page.getByText('已分享')).toBeVisible();

  await page.getByRole('button', { name: '撤销分享' }).click();
  await expect(page).toHaveURL(new RegExp(`/web/detail/${demoState.PDF_CONTENT_ID}(?:\\?.*)?$`));
  await expect(page.getByText('分享已撤销')).toBeVisible();
  await expect(page.getByText('未分享', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '创建分享' }).click();
  await expect(page.getByText('分享已创建')).toBeVisible();
  await expect(page.getByText('已分享')).toBeVisible();

  await page.getByRole('link', { name: '凭据与会话' }).click();
  await expect(page).toHaveURL('/web/credential');
  await expect(page.getByRole('heading', { name: 'Owner 凭据与会话' })).toBeVisible();

  await page.getByRole('button', { name: '退出当前会话' }).click();
  await expect(page).toHaveURL(/\/web\/auth\/login/);
  await expect(page.getByText('已退出')).toBeVisible();
});

test('public discovery pages expose shared rich text and downloadable file delivery', async ({ page }) => {
  await page.goto('/web/public/list');
  await expect(page.getByRole('heading', { name: '公开内容列表' })).toBeVisible();
  await expect(page.getByText(demoState.pdfTitle)).toBeVisible();
  await expect(page.getByText(demoState.htmlTitle)).toBeVisible();

  await page.goto('/web/public/search?q=' + encodeURIComponent('试卷'));
  await expect(page.getByRole('heading', { name: '公开搜索结果' })).toBeVisible();
  await expect(page.getByRole('link', { name: demoState.pdfTitle })).toBeVisible();

  await page.getByRole('link', { name: demoState.pdfTitle }).click();
  await expect(page.getByRole('heading', { name: '公开内容访问' })).toBeVisible();
  await expect(page.getByText('下载原始文件')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载原始文件' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  expect(download.suggestedFilename()).toBe(demoState.pdfPath.split('/').pop());

  const expectedBytes = fs.readFileSync(getFixturePdfPath());
  const actualBytes = fs.readFileSync(downloadPath);
  expect(Buffer.compare(actualBytes, expectedBytes)).toBe(0);

  await page.goto('/web/public/content/' + demoState.HTML_CONTENT_HASH);
  await expect(page.getByRole('heading', { name: '公开内容访问' })).toBeVisible();
  const frame = page.frameLocator('iframe.preview');
  await expect(frame.getByRole('heading', { name: '静态网页服务演示' })).toBeVisible();
  await expect(frame.getByText('这是人工演示的富文本样例。')).toBeVisible();
});
