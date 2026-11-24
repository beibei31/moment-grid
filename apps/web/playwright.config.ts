import { defineConfig, devices } from '@playwright/test';
import { delimiter, join } from 'node:path';

const javaHome = process.env.MOMENT_GRID_JAVA_HOME
  ?? process.env.JAVA_HOME;
const inheritedPath = process.env.Path ?? process.env.PATH ?? '';
const apiEnvironment = javaHome
  ? {
      JAVA_HOME: javaHome,
      PATH: `${join(javaHome, 'bin')}${delimiter}${inheritedPath}`,
    }
  : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'mvn -q -Dmaven.repo.local=../../.m2/repository spring-boot:run',
      cwd: '../api',
      env: apiEnvironment,
      url: 'http://127.0.0.1:8080/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      cwd: '.',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
