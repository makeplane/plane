# Plane Webhook Configuration

## Target

Target internal bridge:

```text
http://openhands-bridge.internal:8645/plane
```

Target ini hanya valid karena bridge dan Plane API berada pada network `plane-app_default`. Jika URL validator Plane menolak hostname, tambahkan `openhands-bridge.internal` ke `WEBHOOK_ALLOWED_HOSTS` lalu recreate service Plane yang membaca setting tersebut.

## Secret separation

| Secret                 | Pemilik                                                        | Fungsi                                                                 |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PLANE_WEBHOOK_SECRET` | bridge + webhook Plane                                         | HMAC raw request body                                                  |
| `PLANE_API_KEY`        | bridge                                                         | API v1 update/state/label/comment handoff Plane                        |
| `PM_PLANE_API_KEY`     | PM read adapter (target/pending wiring; exactly two GET tools) | Plane GET read-only via WireGuard/private network; scoped adapter only |
| `BRIDGE_MCP_TOKEN`     | bridge/manual dispatch                                         | autentikasi dispatch internal                                          |
| `POWER_TOKEN`          | bridge + power-controller                                      | start/stop container OpenHands                                         |

Jangan menaruh secret di description ticket, workspace, `.openhands/mcp.json`, README, atau output log. PM menargetkan penerimaan `PM_PLANE_API_KEY` hanya melalui `agent.mcp_config.env` subprocess adapter read-only setelah transport terdaftar; jangan berikan `PLANE_API_KEY` bridge atau PM secret sebagai prompt/report/general env kepada OpenHands. Payload Agent Canvas dapat dipersist, sehingga redaction/audit policy wajib diverifikasi sebelum live.

## Event contract

Aktifkan issue create/update. Bridge menerima action `create`, `created`, `update`, dan `updated`. Payload harus membawa state detail dan labels detail agar router dapat menentukan role.

Dispatch hanya jika:

- state programmer = `Ready to Work`;
- state QA = `In Review`;
- tepat satu role label;
- ada `exec:ai`;
- tidak ada `blocked:*`;
- tidak sedang ada job aktif.

## Verification checklist

1. Bridge `/health` mengembalikan HTTP 200.
2. Signature valid diterima; signature invalid mendapat 401.
3. Synthetic programmer event menghasilkan dispatch satu kali.
4. Duplicate event tidak menghasilkan conversation kedua.
5. Programmer PASS mengubah state/role menjadi In Review/QA.
6. QA PASS mengubah state menjadi Done.
7. QA FAIL menambah `type:bug` dan mengembalikan state Ready/Open.
8. Event human, blocked, role ganda, Publish, dan state mismatch ditolak.
9. Plane GET sesudah PATCH membuktikan state dan labels benar.
10. Report QA malformed (`tests` list, missing `tests.result`, atau wrong array type) menghasilkan `REPORT_INVALID`, bukan QA FAIL dan bukan rework Plane.
11. Schema repair maksimal dua kali pada conversation yang sama; repair tidak rerun test atau mengubah fakta report.
12. Setelah exhaustion, conversation matching berhenti, raw evidence/audit tersimpan, lock matching dilepas, QA cycle tidak bertambah, dan Plane state/labels tetap.
13. Discord hanya dipakai untuk observability, bukan command input.

Sebelum live webhook, jalankan synthetic signed lifecycle yang terdokumentasi di `../openhands/docs/smoke-tests.md`. Jalankan juga schema-drift smoke dan live-image provenance gate setelah bridge recreate. Jangan dispatch worker hanya karena bridge health `200` atau container `Up`.
