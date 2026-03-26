# Plane E2E Test Suite

This directory contains E2E (End-to-End) tests for Plane using Playwright.

## Setup

1. Install dependencies:
```bash
npm install playwright
npx playwright install chromium
```

2. Configure the test URL in the test file (default: `https://app.plane.so`)

3. Run tests:
```bash
node test_plane_e2e.js
```

## Test Coverage

This E2E test suite verifies:

- **Authentication**: Login, logout, workspace redirect
- **APIs**: All major REST API endpoints
- **UI Navigation**: All pages and routes
- **Projects**: Create, list, detail views
- **Issues/Work Items**: CRUD operations
- **Cycles**: List, create, detail views
- **Modules**: List, create, detail views
- **Views**: Project and workspace views
- **Pages**: List and detail views
- **Settings**: Workspace, project, and profile settings
- **Archives**: Issues, cycles, modules archives
- **Analytics**: Workspace and custom analytics
- **Security**: No mixed content errors, HTTPS-only resources

## Running Individual Tests

The test file can be run as-is with Node.js and Playwright installed.

```bash
# Run all tests
node test_plane_e2e.js

# Run with custom URL (edit the file to change BASE_URL)
```
