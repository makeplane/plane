# Load Test Scenarios (KHKT — Kịch bản test tải)

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** QA/Performance

> Chi tiết kịch bản k6 cho [`load-test-plan.md`](./load-test-plan.md). Thực thi: [`../03-operations/runbooks/load-test-procedure.md`](../03-operations/runbooks/load-test-procedure.md).

---

## 1. Nguyên tắc

- **Mô phỏng user thật**, không chỉ `GET /`. Mỗi VU đăng nhập thật rồi thực hiện chuỗi hành vi.
- Tỉ trọng hành vi (workload mix) phản ánh thực tế: đọc nhiều hơn ghi.
- Dùng auth token thật (LDAP/SwingSSO test account hoặc local user UAT).

## 2. Workload mix (tỉ trọng request)

| Hành vi                     | Tỉ trọng | Method/endpoint (tham chiếu)      |
| --------------------------- | -------- | --------------------------------- |
| Xem danh sách issue/project | 45%      | `GET /api/workspaces/.../issues/` |
| Mở chi tiết issue           | 20%      | `GET /api/.../issues/{id}/`       |
| Tạo/sửa issue (write)       | 15%      | `POST`/`PATCH /api/.../issues/`   |
| Dashboard / analytics       | 10%      | `GET /api/.../dashboard/`         |
| Search                      | 5%       | `GET /api/.../search/?q=`         |
| Upload attachment           | 3%       | presigned URL → MinIO             |
| Realtime WS                 | 2%       | WebSocket `live` subscribe        |

> Endpoint chính xác đối chiếu API thực tế khi viết script (Plane API có thể đổi theo version).

## 3. VU profiles (stages)

### 3.1 Load (gate 100 CCU)

```js
export const options = {
  scenarios: {
    load: {
      executor: "ramping-vus",
      stages: [
        { duration: "5m", target: 100 }, // ramp
        { duration: "30m", target: 100 }, // sustain
        { duration: "2m", target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.01"],
  },
};
```

### 3.2 Stress (tìm breaking point)

```js
stages: [
  { duration: "5m", target: 100 },
  { duration: "5m", target: 200 },
  { duration: "5m", target: 300 },
  { duration: "3m", target: 0 },
];
// Ghi lại CCU mà p95 vượt 500ms / error tăng / OOM-restart.
```

### 3.3 Soak (4h — phát hiện leak)

```js
scenarios: { soak: { executor: 'constant-vus', vus: 80, duration: '4h' } }
// Theo dõi RAM api/worker + connection PG (pg_stat_activity) theo thời gian.
```

## 4. Kịch bản chính (pseudo-k6)

```js
import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL;

export function setup() {
  // login 1 lần lấy token (auth flow thật)
  const res = http.post(`${BASE}/api/auth/login/`, {
    /* creds */
  });
  return { token: res.json("access_token") };
}

export default function (data) {
  const h = { headers: { Authorization: `Bearer ${data.token}` } };

  // 45% list
  let r = http.get(`${BASE}/api/workspaces/shws/issues/`, h);
  check(r, { "list 200": (x) => x.status === 200 });
  sleep(Math.random() * 3 + 1); // think time 1-4s

  // 15% write (theo tỉ trọng — dùng __VU/__ITER để phân nhánh)
  if (__ITER % 7 === 0) {
    r = http.post(`${BASE}/api/workspaces/shws/issues/`, JSON.stringify({ name: `lt-${__VU}-${__ITER}` }), {
      headers: { ...h.headers, "Content-Type": "application/json" },
    });
    check(r, { "create 201": (x) => x.status === 201 });
  }

  // 2% websocket
  if (__ITER % 50 === 0) {
    ws.connect(`${BASE.replace("https", "wss")}/live/`, h, (sock) => {
      sock.on("open", () => sock.close());
    });
  }
  sleep(1);
}
```

> `think time` (sleep 1-4s) quan trọng — không spam liên tục, mô phỏng user thật. Đánh dấu data tạo ra (`lt-` prefix) để [`data-cleanup-after-test`](../03-operations/runbooks/data-cleanup-after-test.md) dọn.

## 5. Pass criteria (mỗi kịch bản)

| Scenario     | Pass                                                        |
| ------------ | ----------------------------------------------------------- |
| Load 100 CCU | p95 < 500ms, p99 < 1500ms, error < 1%, CPU < 70%, RAM < 80% |
| Stress       | breaking point ≥ 150 CCU (kỳ vọng); phục hồi sau giảm tải   |
| Soak 4h      | RAM phẳng (no leak); pool không cạn; throughput ổn định     |

## 6. Theo dõi trong lúc chạy

- Grafana: CPU/RAM/disk 2 node, p95 endpoint
- `pg_stat_activity`: connection count, long query, lock, wait events
- RabbitMQ: queue depth (worker theo kịp không)

## 7. Câu hỏi mở

- [ ] Endpoint API chính xác theo version SHWS hiện tại (đối chiếu khi viết script thật)
- [ ] Auth flow cho k6: dùng local user UAT hay LDAP test account?
- [ ] Có cần test WebSocket sâu hơn (nhiều subscriber/room)?

## 8. Liên kết

- Plan: [`load-test-plan.md`](./load-test-plan.md)
- Runbook thực thi: [`../03-operations/runbooks/load-test-procedure.md`](../03-operations/runbooks/load-test-procedure.md)
- Cleanup: [`../03-operations/runbooks/data-cleanup-after-test.md`](../03-operations/runbooks/data-cleanup-after-test.md)
