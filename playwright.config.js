import { defineConfig } from '@playwright/test';

const servicePort = process.env.E2E_SERVICE_PORT || '8788';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${servicePort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    headless: true,
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `SERVICE_PORT=${servicePort} node src/server.js`,
    url: baseURL + '/api/health',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30000
  }
});
