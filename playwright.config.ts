import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:5175/interactive_solar_system/',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    reducedMotion: 'reduce',
    launchOptions: { args: process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node serve.js',
    url: 'http://127.0.0.1:5175/interactive_solar_system/',
    env: { PORT: '5175', BASE_PATH: '/interactive_solar_system/' },
    reuseExistingServer: false,
  },
});
