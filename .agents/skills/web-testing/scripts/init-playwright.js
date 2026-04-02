#!/usr/bin/env node
/**
 * Initialize Playwright with best-practice configuration
 * Usage: node init-playwright.js [--ct] [--dir <path>]
 *
 * Options:
 *   --ct       Include component testing setup
 *   --dir      Target directory (default: current directory)
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const includeComponentTesting = args.includes('--ct');
const dirIndex = args.indexOf('--dir');
const targetDir = dirIndex !== -1 ? args[dirIndex + 1] : process.cwd();

// Configuration templates
const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
`;

const authFixture = `import { test as base, expect, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser, request }, use, testInfo) => {
    // API-based authentication (faster than UI login)
    const response = await request.post('/api/auth/login', {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'password',
      },
    });

    if (!response.ok()) {
      throw new Error(\`Auth failed: \${response.status()}\`);
    }

    const { token } = await response.json();
    const context = await browser.newContext();

    // Set auth cookie/header
    await context.addCookies([
      {
        name: 'auth-token',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
`;

const exampleTest = `import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('homepage passes axe checks', async ({ page }) => {
    await page.goto('/');
    // Install @axe-core/playwright for full accessibility testing
    // const results = await new AxeBuilder({ page }).analyze();
    // expect(results.violations).toEqual([]);
  });
});
`;

const authTest = `import { test, expect } from '../fixtures/auth';

test.describe('Authenticated User', () => {
  test('can access dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
});
`;

const globalSetup = `import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Run once before all tests
  // Example: seed database, create test users

  console.log('Global setup running...');

  // Optional: Create authenticated state for reuse
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // await page.goto(config.projects[0].use.baseURL + '/login');
  // // ... login flow
  // await page.context().storageState({ path: './playwright/.auth/user.json' });
  // await browser.close();
}

export default globalSetup;
`;

const componentTestConfig = `import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.ct.{ts,tsx}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
`;

const envExample = `# Test environment variables
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password
`;

// File creation helper
function writeFile(filePath, content) {
  const fullPath = path.join(targetDir, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping (exists): ${filePath}`);
    return;
  }

  fs.writeFileSync(fullPath, content);
  console.log(`✅ Created: ${filePath}`);
}

// Main execution
console.log('\n🎭 Initializing Playwright with best practices...\n');

// Core files
writeFile('playwright.config.ts', playwrightConfig);
writeFile('tests/e2e/fixtures/auth.ts', authFixture);
writeFile('tests/e2e/example.spec.ts', exampleTest);
writeFile('tests/e2e/auth.spec.ts', authTest);
writeFile('tests/e2e/global-setup.ts', globalSetup);
writeFile('.env.test.example', envExample);

// Component testing (optional)
if (includeComponentTesting) {
  writeFile('playwright-ct.config.ts', componentTestConfig);
  console.log('\n📦 Component testing config created. Install:');
  console.log('   npm install -D @playwright/experimental-ct-react');
}

// Package.json scripts suggestion
console.log('\n📝 Add to package.json scripts:');
console.log(`
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug"
`);

// Install commands
console.log('\n📦 Install dependencies:');
console.log('   npm install -D @playwright/test');
console.log('   npx playwright install');

if (includeComponentTesting) {
  console.log('   npm install -D @playwright/experimental-ct-react');
}

console.log('\n✨ Playwright setup complete!\n');
