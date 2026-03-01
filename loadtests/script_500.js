import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m',  target: 200 },
    { duration: '1m',  target: 300 },
    { duration: '1m',  target: 400 },
    { duration: '1m',  target: 500 },
    { duration: '5m',  target: 500 },   // steady state
    { duration: '1m',  target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<20000'], // 20s at this scale is realistic
  },
};

// -------- tuning knobs --------
const REQ_TIMEOUT = '20s';
const SLEEP_BETWEEN_REQUESTS = 2.5;

// -------- auth / base --------
const COOKIE =
  'session-id=aiva7cr9c6rs4zqvc35zrcy1yjttli0c0k8y8w9hb884rzmf75m1euqk1zko7h8od5mlqsfcfl9zsvdj0bp2z600v8niyr4rnnmagv5d3ltjcuxcbxr5sjjs5owxpizj';

const API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/plane/projects';

const COMMON_HEADERS = {
  Accept: 'application/json',
  Cookie: COOKIE,
};

const POST_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Cookie: COOKIE,
};

const PROJECT_IDS = [
  '106035e0-0be5-4a27-85eb-9f47663d4d7b',
  '9d282c44-c53a-47e9-b5e8-199ef72d1b4b',
  '1e6f99d2-8eb3-4615-84b8-1c9a0ac1cacc',
];

// -------- helpers --------
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

// -------- main --------
export default function () {
  // spread load evenly across projects
  const projectId =
    PROJECT_IDS[(__VU - 1) % PROJECT_IDS.length];

  const op = __ITER % 10;
  let res;

  if (op < 2) {
    // 20% GET projects
    res = http.get(`${API_BASE}/`, {
      headers: COMMON_HEADERS,
      timeout: REQ_TIMEOUT,
      tags: { endpoint: 'get_projects' },
    });

  } else if (op < 4) {
    // 20% GET cycles
    res = http.get(
      `${API_BASE}/${projectId}/cycles/`,
      {
        headers: COMMON_HEADERS,
        timeout: REQ_TIMEOUT,
        tags: { endpoint: 'get_cycles' },
      }
    );

  } else if (op < 6) {
    // 20% GET pages
    res = http.get(
      `${API_BASE}/${projectId}/pages/?search=&type=public`,
      {
        headers: COMMON_HEADERS,
        timeout: REQ_TIMEOUT,
        tags: { endpoint: 'get_pages' },
      }
    );

  } else if (op < 7) {
    // 10% POST create issue (reduced write pressure)
    res = http.post(
      `${API_BASE}/${projectId}/issues/`,
      issuePayload(projectId),
      {
        headers: POST_HEADERS,
        timeout: REQ_TIMEOUT,
        tags: { endpoint: 'create_issue' },
      }
    );

  } else {
    // 30% mixed read/write (POST + optional DELETE)
    res = http.post(
      `${API_BASE}/${projectId}/issues/`,
      issuePayload(projectId),
      {
        headers: POST_HEADERS,
        timeout: REQ_TIMEOUT,
        tags: { endpoint: 'create_issue_delete' },
      }
    );

    if (res && (res.status === 200 || res.status === 201)) {
      try {
        const issue = JSON.parse(res.body);
        if (issue.id) {
          http.del(
            `${API_BASE}/${projectId}/issues/${issue.id}/`,
            null,
            {
              headers: COMMON_HEADERS,
              timeout: REQ_TIMEOUT,
              tags: { endpoint: 'delete_issue' },
            }
          );
        }
      } catch (_) {}
    }
  }

  check(res, {
    'status is 2xx': (r) => r && r.status >= 200 && r.status < 300,
  });

  sleep(SLEEP_BETWEEN_REQUESTS);
}