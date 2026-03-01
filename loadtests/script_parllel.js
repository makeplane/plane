import http from 'k6/http';
import { sleep, check } from 'k6';

// ─────────────────────────────────────────
// 1️⃣ OPTIONS — PARALLEL SCENARIOS
// ─────────────────────────────────────────
export const options = {
  scenarios: {
    read_scenario: {
      executor: 'ramping-vus',
      exec: 'readFlow',
      stages: [
        { duration: '1m', target: 200 },
        { duration: '1m', target: 400 },
        { duration: '1m', target: 600 },
        { duration: '1m', target: 800 },
        { duration: '5m', target: 800 },
        { duration: '2m', target: 0 },
      ],
    },

    write_scenario: {
      executor: 'ramping-vus',
      exec: 'writeFlow',
      stages: [
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '1m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<25000'],
  },
};

// ─────────────────────────────────────────
// 2️⃣ SHARED CONSTANTS
// ─────────────────────────────────────────
const WRITE_API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/plane/projects';

// ✅ ONE SESSION COOKIE (shared by read & write)
const SESSION_COOKIE =
  'session-id=REDACTED';

const COMMON_HEADERS = {
  Accept: 'application/json',
  Cookie: SESSION_COOKIE,
};

const POST_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Cookie: SESSION_COOKIE,
};

const WRITE_PROJECT_IDS = [
  '106035e0-0be5-4a27-85eb-9f47663d4d7b',
  '9d282c44-c53a-47e9-b5e8-199ef72d1b4b',
  'f7aef638-beba-4711-8887-1a7ce61178cc',
];

const READ_API_BASE =
  'https://commercial.loadtest.plane.town/api/workspaces/loadtest';

const READ_PROJECT_IDS = [
  'fa78a429-86f5-4a83-a281-2e5429061862',
  '4903d469-22b0-4df4-be49-8cb869e10dfb',
  '6b42c5b4-3105-4f1b-a698-9f0131786b76',
  'ac43d2f8-0089-4a7a-b0fe-10c616f31808',
  'ee5c2c00-798c-4099-9fcb-f1f45c29948b',
];

// ─────────────────────────────────────────
// 3️⃣ HELPERS
// ─────────────────────────────────────────
function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function issuePayload(projectId) {
  return JSON.stringify({
    project_id: projectId,
    name: `Issue-${randomString(6)}`,
    description_html: `<p>${randomString(12)}</p>`,
    priority: 'none',
    assignee_ids: [],
    label_ids: [],
  });
}

// Log only failures (safe for short debug runs)
function logFailure(prefix, res) {
  if (!res) {
    console.error(`${prefix} FAILED: no response`);
    return;
  }

  if (res.status >= 400) {
    const bodySnippet =
      res.body && res.body.length > 300
        ? res.body.substring(0, 300) + '...'
        : res.body;

    console.error(
      `${prefix} FAILED | status=${res.status} | body=${bodySnippet}`
    );
  }
}

// ─────────────────────────────────────────
// 4️⃣ READ FLOW — ALL GET REQUESTS
// ─────────────────────────────────────────
export function readFlow() {
  const readProjectId =
    READ_PROJECT_IDS[(__VU - 1) % READ_PROJECT_IDS.length];

  const op = __ITER % 3;
  let res;

  if (op === 0) {
    res = http.get(`${READ_API_BASE}/`, {
      headers: COMMON_HEADERS,
      tags: { traffic: 'read', endpoint: 'get_projects' },
    });
  } else if (op === 1) {
    res = http.get(
      `${READ_API_BASE}/projects/${readProjectId}/cycles/`,
      {
        headers: COMMON_HEADERS,
        tags: { traffic: 'read', endpoint: 'get_cycles' },
      }
    );
  } else {
    res = http.get(
      `${READ_API_BASE}/modules/`,
      {
        headers: COMMON_HEADERS,
        tags: { traffic: 'read', endpoint: 'get_modules' },
      }
    );
  }

  logFailure('READ', res);

  check(res, {
    'read status is 2xx': (r) => r && r.status >= 200 && r.status < 300,
  });

  sleep(2);
}

// ─────────────────────────────────────────
// 5️⃣ WRITE FLOW — CREATE + DELETE
// ─────────────────────────────────────────
export function writeFlow() {
  const writeProjectId =
    WRITE_PROJECT_IDS[(__VU - 1) % WRITE_PROJECT_IDS.length];

  const res = http.post(
    `${WRITE_API_BASE}/${writeProjectId}/issues/`,
    issuePayload(writeProjectId),
    {
      headers: POST_HEADERS,
      tags: { traffic: 'write', endpoint: 'create_issue' },
    }
  );

  logFailure('WRITE-CREATE', res);

  check(res, {
    'write create is 2xx': (r) =>
      r && (r.status === 200 || r.status === 201),
  });

  if (res && (res.status === 200 || res.status === 201)) {
    try {
      const issue = JSON.parse(res.body);
      if (issue.id) {
        // Brief pause so create is committed before delete (reduces 404s from timing/retries).
        sleep(0.5);

        const delRes = http.del(
          `${WRITE_API_BASE}/${writeProjectId}/issues/${issue.id}/`,
          null,
          {
            headers: COMMON_HEADERS,
            tags: { traffic: 'write', endpoint: 'delete_issue' },
          }
        );

        // 404 = "object does not exist" — often means already soft-deleted (e.g. first DELETE succeeded, retry got 404). Log as warning.
        if (delRes && delRes.status === 404) {
          console.log(
            `[WARN] WRITE-DELETE 404 (already deleted?) project=${writeProjectId} issueId=${issue.id}`
          );
        } else {
          logFailure('WRITE-DELETE', delRes);
        }
      }
    } catch (e) {
      console.error(`WRITE PARSE ERROR: ${e.message}`);
    }
  }

  sleep(3);
}
