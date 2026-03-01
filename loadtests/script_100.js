import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 75 },
    { duration: '30s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<15000'],  // 15s to allow for slow responses under load
  },
};

// Longer timeout so requests complete under load; increase sleep to reduce burst rate.
const REQ_TIMEOUT = '15s';
const SLEEP_BETWEEN_REQUESTS = 1.5;

const COOKIE =
  'session-id=aiva7cr9c6rs4zqvc35zrcy1yjttli0c0k8y8w9hb884rzmf75m1euqk1zko7h8od5mlqsfcfl9zsvdj0bp2z600v8niyr4rnnmagv5d3ltjcuxcbxr5sjjs5owxpizj';

const API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/plane/projects';

// Match browser request (e.g. GET .../projects/ with same headers as curl).
const COMMON_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,te;q=0.8',
  Cookie: COOKIE,
  Referer: 'https://commercial.loadtest.plane.town/plane/projects/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
};

const POST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  Cookie: COOKIE,
  Referer: 'https://commercial.loadtest.plane.town/plane/projects/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
};

// Only include projects the load-test user has access to (Member/Admin). Remove any that return 403.
const PROJECT_IDS = [
  '106035e0-0be5-4a27-85eb-9f47663d4d7b',
  '9d282c44-c53a-47e9-b5e8-199ef72d1b4b',
  'f7aef638-beba-4711-8887-1a7ce61178cc'
];

// ---------- helpers ----------

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function issuePayload(projectId) {
  return JSON.stringify({
    project_id: projectId,
    name: `Issue ${randomString(6)}`,
    description_html: `<p>${randomString(12)}</p>`,
    priority: 'none',
    assignee_ids: [],
    label_ids: [],
  });
}

// Log failure with response body to debug 403 etc. (body truncated to avoid huge logs).
function logFailed(opLabel, projectId, res, extra = '') {
  const body = res.body && res.body.length > 0 ? res.body : '(empty)';
  const bodyPreview = body.length > 300 ? body.slice(0, 300) + '...' : body;
  console.log(
    `[FAILED] ${opLabel} project=${projectId ?? 'n/a'} status=${res.status} ${extra} body=${bodyPreview}`
  );
}

// ---------- main ----------

export default function () {
  // Evenly distribute projects by VU
  const projectId =
    PROJECT_IDS[(__VU - 1) % PROJECT_IDS.length];

  // Evenly distribute operations by iteration
  const op = (__ITER % 10);

  // 0–1 → 20% GET projects
  if (op < 2) {
    const res = http.get(`${API_BASE}/`, {
      headers: COMMON_HEADERS,
      timeout: REQ_TIMEOUT,
    });
    if (res.status === 0 || res.status >= 400) {
      logFailed('GET projects', null, res, '(0=timeout, 4xx/5xx=error)');
    }
  }

  // 2–3 → 20% GET cycles (GET .../projects/:id/cycles/ with session-id cookie; returns JSON array of cycles)
  else if (op < 4) {
    const res = http.get(
      `${API_BASE}/${projectId}/cycles/`,
      { headers: COMMON_HEADERS, timeout: REQ_TIMEOUT }
    );
    if (res.status === 0 || res.status >= 400) {
      logFailed('GET cycles', projectId, res);
    }
  }

  // 4–5 → 20% GET pages
  else if (op < 6) {
    const res = http.get(
      `${API_BASE}/${projectId}/pages/?search=&type=public`,
      { headers: COMMON_HEADERS, timeout: REQ_TIMEOUT }
    );
    if (res.status === 0 || res.status >= 400) {
      logFailed('GET pages', projectId, res);
    }
  }

  // 6–8 → 30% POST create issue
  else if (op < 9) {
    const res = http.post(
      `${API_BASE}/${projectId}/issues/`,
      issuePayload(projectId),
      { headers: POST_HEADERS, timeout: REQ_TIMEOUT }
    );
    if (res.status === 0 || res.status >= 400) {
      logFailed('POST create', projectId, res);
    }
  }

  // 9 → 10% POST + DELETE
  else {
    const res = http.post(
      `${API_BASE}/${projectId}/issues/`,
      issuePayload(projectId),
      { headers: POST_HEADERS, timeout: REQ_TIMEOUT }
    );

    if (res.status === 0 || res.status >= 400) {
      logFailed('POST create (before delete)', projectId, res);
    } else if (res.status === 200 || res.status === 201) {
      try {
        const issue = JSON.parse(res.body);
        if (issue.id) {
          const delRes = http.del(
            `${API_BASE}/${projectId}/issues/${issue.id}/`,
            null,
            { headers: COMMON_HEADERS, timeout: REQ_TIMEOUT }
          );
          if (delRes.status === 0 || delRes.status >= 400) {
            logFailed('DELETE', projectId, delRes, `issueId=${issue.id}`);
          }
        }
      } catch (_) {}
    }
  }

  sleep(SLEEP_BETWEEN_REQUESTS);
}
