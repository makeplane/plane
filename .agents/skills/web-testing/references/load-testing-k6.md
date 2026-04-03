# Load Testing with k6

## Installation

```bash
brew install k6          # macOS
winget install k6        # Windows
docker run -i grafana/k6 run - <script.js
```

## Basic Load Test

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

## Stress Test with Stages

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

## With Authentication

```javascript
export function setup() {
  const res = http.post(`${BASE_URL}/api/login`, {
    email: 'test@example.com', password: 'password',
  });
  return { token: res.json('token') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  http.get(`${BASE_URL}/api/protected`, params);
}
```

## Performance Thresholds

| Metric | Good | Warning |
|--------|------|---------|
| p50 latency | <200ms | <500ms |
| p95 latency | <500ms | <1s |
| Error rate | <0.1% | <1% |

## Commands

```bash
k6 run script.js
k6 run --out json=results.json script.js
k6 cloud script.js  # Grafana Cloud
```

## Artillery Alternative

```yaml
config:
  target: 'http://localhost:3000'
  phases: [{ duration: 60, arrivalRate: 10 }]
scenarios:
  - flow: [{ get: { url: '/api/users' } }]
```

```bash
npx artillery run artillery.yml
```
