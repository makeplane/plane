# Integration Tests

This directory contains end-to-end integration tests for the application using Playwright.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Playwright browsers installed

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Create a `.env` file in the `tests/integration-tests` directory with the following variables:
```env
BASE_URL=http://localhost:3000  # Your application URL
EMAIL=your-email@example.com    # Your test user email
PASSWORD_BASE64=base64-encoded-password  # Your test user password in base64
```

## Running Tests

### Authentication Setup

First, you need to set up the authentication state:

```bash
npx playwright test auth.setup.ts
```

This will create a `playwright/.auth/user.json` file containing the authentication state.

### Running All Tests

```bash
npx playwright test
```

### Running Specific Test Files

```bash
# Run a specific test file
npx playwright test projects.spec.ts

# Run tests in a specific browser
npx playwright test --project=chromium
```

### Running Tests in UI Mode

```bash
npx playwright test --ui
```

### Debugging Tests

```bash
# Run tests in debug mode
npx playwright test --debug

# Run a specific test in debug mode
npx playwright test projects.spec.ts --debug
```

## Test Structure

- `auth.setup.ts`: Handles user authentication and creates a persistent auth state
- `projects.spec.ts`: Contains the actual test cases for the projects functionality

## Test Reports

After running tests, you can view the HTML report:

```bash
npx playwright show-report
```

## Troubleshooting

1. If tests fail due to authentication:
   - Delete the `playwright/.auth/user.json` file
   - Run `npx playwright test auth.setup.ts` again
   - Try running your tests

2. If you need to see what's happening during test execution:
   - Use `--debug` flag
   - Or run with `--headed` flag to see the browser

3. If you need to update the auth state:
   - Delete the existing auth file
   - Run the auth setup again
   - Run your tests

## CI/CD Integration

For CI/CD environments, make sure to:
1. Set the appropriate environment variables
2. Run `npx playwright install-deps` before running tests
3. Use `--reporter=html` for test reports 