# Plane E2E Smoke Test Suite

This directory contains browser-based E2E smoke tests for a **live Plane deployment**, using
Playwright. They complement (not replace) the Python unit and contract tests already in this
repository (`tests/unit/` and `tests/contract/`).

## Relationship to other tests in this repo

| Layer | Location | What it tests |
| --- | --- | --- |
| Unit | `tests/unit/` | Isolated model/serializer/utility logic |
| Contract | `tests/contract/` | API endpoint contracts via Django test client |
| Smoke (Python) | `tests/smoke/test_auth_smoke.py` | Auth endpoint reachability against a running server |
| **E2E (this dir)** | `tests/smoke/test_plane_e2e.js` | Full browser flow on a live deployment |

The E2E test exercises browser login, SPA hydration, UI navigation, and endpoint reachability
end-to-end. It intentionally covers some of the same endpoints as the contract tests (cycles,
labels, projects, issues) but at the integration level — verifying the whole stack including
web server, auth cookies, and client-side routing rather than just the Django layer in isolation.

## Setup

1. Install dependencies:
```bash
npm install playwright
npx playwright install chromium
```

2. Export environment variables for your target deployment:

| Variable | Default | Description |
| --- | --- | --- |
| `PLANE_BASE_URL` | `http://localhost` | Base URL of the Plane instance |
| `PLANE_EMAIL` | `admin@plane.local` | Login email |
| `PLANE_PASSWORD` | `admin` | Login password |
| `PLANE_WORKSPACE_SLUG` | `my-workspace` | Workspace slug to test against |

3. Run tests:
```bash
export PLANE_BASE_URL=https://your-plane-instance.example.com
export PLANE_EMAIL=you@example.com
export PLANE_PASSWORD=yourpassword
export PLANE_WORKSPACE_SLUG=your-workspace

node test_plane_e2e.js
```

## Test Coverage

This E2E test suite verifies:

- **Authentication**: Login, workspace redirect (browser flow)
- **Instance & Workspace APIs**: `/api/instances/`, `/api/users/me/`, workspaces
- **Project APIs**: List, create, detail
- **Issues/Work Items**: Create, list, delete
- **States, Labels**: List endpoints
- **Cycles**: List, create, delete
- **Modules**: List, create, delete
- **Pages**: List endpoint
- **Members & Invitations**: Reachability
- **User Favorites, Stickies, Quick Links, Recent Visits, Notifications, Estimates**
- **UI Navigation**: Projects page, dashboard, workspace settings, members settings
- **Security**: No mixed content errors, no critical JS errors
- **Cleanup**: All test data deleted on completion

