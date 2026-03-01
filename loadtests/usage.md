# Plane Load Tests

k6-based load tests for the Plane API. The main script runs **parallel read and write scenarios**: read traffic (GET projects, cycles, modules) and write traffic (create + delete issues) ramp independently.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed

### Install k6

```bash
# macOS (Homebrew)
brew install k6

# Or download from https://k6.io/docs/get-started/installation/
```

## Quick Start

**Recommended: parallel read/write script with JSON output**

```bash
cd loadtests
k6 run --out json=results_1000.json script_parllel.js
```

To run without writing results to a file:

```bash
k6 run script_parllel.js
```

## Scripts

| Script | Description |
| ------ | ----------- |
| **script_parllel.js** | Two scenarios: read (GET projects, cycles, modules) and write (create + delete issues). Read and write VUs ramp independently. Use this for mixed read/write load. |
| script.js | Single-scenario script (all operations in one flow). Simpler, fewer VUs. |
| script_100.js / script_500.js | Variants with different stage targets. |

## Configuration (script_parllel.js)

### 1. Session Cookie

The script authenticates with a single session. Set `SESSION_COOKIE` in `script_parllel.js`:

```javascript
const SESSION_COOKIE =
  'session-id=YOUR_SESSION_ID_HERE';
```

**How to get a session cookie:**

1. Log in to Plane (e.g. https://commercial.loadtest.plane.town)
2. Open browser DevTools → Application (or Storage) → Cookies
3. Copy the `session-id` value

### 2. Write API (workspace `plane`)

Used only for the **write scenario**: create issue (POST) and delete issue (DELETE).

```javascript
const WRITE_API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/plane/projects';

const WRITE_PROJECT_IDS = [
  'uuid-1',
  'uuid-2',
  'uuid-3',
];
```

- **WRITE_API_BASE** – Base URL for the `plane` workspace projects API.
- **WRITE_PROJECT_IDS** – Project UUIDs used for write operations (create/delete issue). The session user must have access to these projects.

### 3. Read API (workspace `loadtest`)

Used for all **read-scenario** requests: GET projects, GET cycles, and GET modules.

```javascript
const READ_API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/loadtest';

const READ_PROJECT_IDS = [
  'uuid-1',
  'uuid-2',
  // ... projects used only for GET cycles
];
```

- **READ_API_BASE** – Base URL for the `loadtest` workspace (cycles and modules).
- **READ_PROJECT_IDS** – Project UUIDs used for GET cycles. GET modules uses the workspace-level `/modules/` endpoint (no project ID).

Ensure the session user has access to both workspaces and the listed projects.

## Load Profile (script_parllel.js)

Two scenarios run in parallel.

### Read scenario

| Stage | Duration | Target VUs |
| ----- | -------- | ---------- |
| Ramp up | 1m | 200 |
| Ramp up | 1m | 400 |
| Ramp up | 1m | 600 |
| Ramp up | 1m | 800 |
| Steady | 5m | 800 |
| Ramp down | 2m | 0 |

**Operation mix (per iteration, 3-way rotation):**

| Operation | Description |
| --------- | ----------- |
| GET projects | List projects (READ_API_BASE) |
| GET cycles | List cycles for a project (READ_API_BASE/projects/:id/cycles/) |
| GET modules | List modules (READ_API_BASE/modules/) |

Each read iteration sleeps 2s after the request.

### Write scenario

| Stage | Duration | Target VUs |
| ----- | -------- | ---------- |
| Ramp up | 1m | 50 |
| Ramp up | 1m | 100 |
| Ramp up | 1m | 150 |
| Ramp up | 1m | 200 |
| Steady | 5m | 200 |
| Ramp down | 2m | 0 |

**Operation:** Create an issue (POST), then delete it (DELETE). Each write iteration sleeps 3s after.

### Thresholds

- **http_req_failed:** &lt; 5%
- **http_req_duration p(95):** &lt; 15000 ms (15 s)

A run fails if these thresholds are breached.

## Usage Examples

```bash
# Run parallel script and write results to JSON (e.g. for 1000 VU equivalent analysis)
k6 run --out json=results_1000.json script_parllel.js

# Run with default options (no JSON output)
k6 run script_parllel.js

# Run simple single-scenario script
k6 run script.js

# Run with custom VUs/duration (overrides script stages)
k6 run --vus 100 --duration 2m script_parllel.js

# Run with verbose output
k6 run --verbose script_parllel.js
```

## Output

k6 prints summary metrics, including:

- **http_req_duration** – response times (overall and by tag if configured)
- **http_req_failed** – failure rate
- **iterations** – completed iterations per scenario
- **vus** – virtual users

With `--out json=results_1000.json` you can feed the JSON into other tools for analysis or dashboards.

## Customization

- **options.scenarios** – Adjust stages (duration, target VUs) for read and write in `script_parllel.js`.
- **options.thresholds** – Change failure or latency SLOs.
- **WRITE_PROJECT_IDS** / **READ_PROJECT_IDS** – Add or remove project UUIDs; ensure the session has access.
- **sleep()** in readFlow (2s) and writeFlow (3s) – Change think time between iterations.

## Infrastructure: Database & RDS Proxy

Load tests target an environment with **read replicas** and **RDS Proxy**. Ensure both are configured:

| Variable | Purpose |
| -------- | ------- |
| DATABASE_URL | Primary writer connection |
| DATABASE_READ_REPLICA_URL | Read replica for queries |

### Recommended Settings for Load Tests

For load tests, use stricter connection limits and shorter timeouts:

| Setting | Recommended |
| ------- | ----------- |
| **IdleClientTimeout** | 60 |
| **MaxConnectionsPercent** | 70 |
| **MaxIdleConnectionsPercent** | 20 |
| **ConnectionBorrowTimeout** | 5 |

**Example RDS Proxy config:**

```json
{
  "IdleClientTimeout": 60,
  "MaxConnectionsPercent": 70,
  "MaxIdleConnectionsPercent": 20,
  "ConnectionBorrowTimeout": 5,
  "SessionPinningFilters": []
}
```

### Application Pods (Kubernetes)

Scale API pods to handle concurrent traffic. Use a **Horizontal Pod Autoscaler (HPA)** for automatic scaling.

**Validated configuration (500 VUs, pods stable):**

- **Replicas:** 6 pods
- **Resources per pod:**

```yaml
resources:
  limits:
    cpu: "2"
    memory: 5000Mi
  requests:
    cpu: 50m
    memory: 50Mi
```

### Scale Summary

| Read VUs (max) | Write VUs (max) | Est. req/s | Pods (2 CPU, 5Gi each) | Primary DB | Read replicas |
|----------------|-----------------|------------|-------------------------|------------|----------------|
| 800 | 200 | ~120–200 | 10–12 | db.m6gd.large | 1+ |
| Higher | Higher | Scale up | 50–60 for 5k VUs | db.m6gd.xlarge+ | 2+ |

Adjust stages in `script_parllel.js` and pod/DB resources as needed for your target load.
