# Runbook — Manual VACUUM / xử lý bloat

**Status:** 🟡 Draft
**Cập nhật:** 2026-05-27
**Owner:** duonglx · **Audience:** DBA
**Host:** `shwsdb1p`

> Thiết kế gốc: [`06-database-design.md`](../../01-system-design/06-database-design.md) §12.2,§12.3. Autovacuum chạy nền (scale_factor 0.1); runbook này khi autovacuum không đủ.

---

## 1. Khi nào dùng

- Alert `n_dead_tup` > 50% hoặc table bloat > 20% / index bloat > 30%
- Cache hit ratio giảm, query chậm dần trên table ghi nhiều
- Sau bulk delete/import lớn
- Autovacuum bị block bởi long transaction (DB-R-02)

**Lưu ý:** `VACUUM FULL` lấy **exclusive lock** → chỉ chạy trong maintenance window (CN 04:00–06:00). `VACUUM`/`ANALYZE` thường + `REINDEX CONCURRENTLY` ít/không lock.

---

## 2. Pre-check

```bash
sudo -iu postgres psql -d plane

-- 2.1 Dead tuples theo table
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup*100.0/NULLIF(n_live_tup+n_dead_tup,0),1) AS dead_pct,
       last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC LIMIT 20;

-- 2.2 Long transaction đang block autovacuum?
SELECT pid, state, now()-xact_start AS xact_age, query
FROM pg_stat_activity
WHERE state <> 'idle' AND now()-xact_start > interval '5 min'
ORDER BY xact_age DESC;
```

- [ ] Xác định table bloat cao nhất
- [ ] Kiểm có long tx chặn autovacuum không (xử lý trước nếu có)
- [ ] Nếu định `VACUUM FULL` → đang trong maintenance window + đã backup

---

## 3. Action

### 3.1 Long transaction chặn autovacuum

```sql
-- Xác định rồi terminate cẩn trọng (xác nhận không phải job quan trọng)
SELECT pg_terminate_backend(<pid>);
-- idle_in_transaction_session_timeout=600s đáng lẽ tự dọn; can thiệp nếu vượt
```

### 3.2 VACUUM ANALYZE thường (không lock nặng)

```sql
VACUUM (VERBOSE, ANALYZE) public.<table>;
-- hoặc toàn DB ngoài giờ cao điểm:
-- (chạy trong tmux/screen vì có thể lâu)
```

### 3.3 VACUUM FULL (chỉ maintenance window — exclusive lock)

```sql
-- Đo bloat trước (pgstattuple cài on-demand)
CREATE EXTENSION IF NOT EXISTS pgstattuple;
SELECT * FROM pgstattuple('public.<table>');

VACUUM (FULL, VERBOSE, ANALYZE) public.<table>;   -- table-by-table, KHÔNG cả DB cùng lúc
```

### 3.4 Index bloat → REINDEX CONCURRENTLY (PG 12+, ít lock)

```sql
REINDEX INDEX CONCURRENTLY public.<index_name>;
-- hoặc cả table:
REINDEX TABLE CONCURRENTLY public.<table>;
```

---

## 4. Verification

```sql
-- dead tuples giảm
SELECT relname, n_dead_tup FROM pg_stat_user_tables
WHERE relname='<table>';

-- kích thước table/index sau vacuum
SELECT pg_size_pretty(pg_total_relation_size('public.<table>'));

-- bloat sau (pgstattuple)
SELECT dead_tuple_percent FROM pgstattuple('public.<table>');
```

- [ ] `n_dead_tup` giảm rõ rệt
- [ ] Table/index size giảm (với VACUUM FULL/REINDEX)
- [ ] Query trên table đó nhanh lại (so p95 trước/sau)
- [ ] Không còn long tx treo

---

## 5. Rollback

- VACUUM/REINDEX không phá dữ liệu → không cần rollback dữ liệu.
- `VACUUM FULL` cần disk tạm ~kích thước table; nếu hết disk giữa chừng → dừng, dọn disk ([`disk-full-recovery.md`](./disk-full-recovery.md)), thử lại.
- Lỡ terminate nhầm backend quan trọng → job/app retry; theo dõi log.

---

## 6. Escalation

| Tình huống                                 | Báo ai         | Khi nào                                               |
| ------------------------------------------ | -------------- | ----------------------------------------------------- |
| Bloat tái diễn liên tục (autovacuum yếu)   | DBA Lead       | Trong tuần (cân nhắc tune autovacuum / pg_repack GĐ2) |
| `VACUUM FULL` cần ngoài maintenance window | DBA Lead + SRE | Trước khi chạy                                        |
| Disk hết khi VACUUM FULL                   | DBA + Infra    | NGAY                                                  |

---

## 7. Liên kết

- DB design (vacuum/reindex strategy): [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.2–12.3
- Maintenance window: [`../../01-system-design/06-database-design.md`](../../01-system-design/06-database-design.md) §12.1
- Disk full: [`disk-full-recovery.md`](./disk-full-recovery.md)
- Routine checklist: [`../routine-maintenance.md`](../routine-maintenance.md)
