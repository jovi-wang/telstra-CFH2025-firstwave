import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000, // 60s per test (AI responses can be slow)
  expect: { timeout: 30_000 },
  fullyParallel: false, // Tests are sequential (shared state in backend)
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    headless: false,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          slowMo: 250,
          args: [
            '--window-size=1920,1080',
            '--window-position=0,0',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
    },
  ],

  webServer: [
    {
      // Backend: uvicorn via the venv inside backend-api/
      command: '.venv/bin/uvicorn app.main:app --port 4000',
      cwd: path.resolve(__dirname, '../backend-api'),
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Frontend: vite dev server
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../frontend-dashboard'),
      url: FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
