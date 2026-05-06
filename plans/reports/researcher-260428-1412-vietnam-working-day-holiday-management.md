# Research Report: Vietnam Working-Day & Holiday Management cho God-Mode

**Date:** 2026-04-28 | **Researcher:** ck-research | **Target:** plane.so monorepo / apps/admin (god-mode) + apps/api (Django/Celery)

---

## Executive Summary

Plane.so hiện không có khái niệm "ngày làm việc theo lịch VN". Toàn bộ Celery beat job chạy theo UTC cron cố định (`apps/api/plane/celery.py`) — không quan tâm cuối tuần, lễ, hay nghỉ bù do MOLISA công bố. Cần build một **Business Calendar subsystem** ở backend (Django) + UI quản trị ở **god-mode** (apps/admin) làm SoT cho mọi job/feature cần check `is_working_day(date)`.

**Scope đã chốt (manual-only)**: nhân viên ngân hàng đăng nhập god-mode khai báo trực tiếp. KHÔNG auto-import từ thư viện hay API external. Mục tiêu: UI admin dễ dùng + helper API gọn cho task scheduler.

Đề xuất: model 3-tầng (`WorkSchedule` → `Holiday` → `DayOverride`) lưu trong Postgres, expose service `BusinessCalendarService` (single function `is_working_day()`), integrate vào Celery qua decorator `@working_day_required` cho từng task. UI god-mode CRUD đơn giản — calendar view + form thêm/sửa lễ + form thêm ngày swap (workday hoán đổi).

---

## 1. Vietnam Context (Pháp lý)

### 1.1 Cơ sở pháp lý

- **Bộ Luật Lao Động 2019**, Điều 112: 11 ngày lễ chính thức/năm
  - Tết Dương lịch: 1 ngày (1/1)
  - Tết Âm lịch: 5 ngày (giao thừa + 4 ngày sau)
  - Giải phóng miền Nam: 30/4
  - Quốc tế Lao động: 1/5
  - Quốc khánh: 2 ngày (1/9 hoặc 2/9 + 1 ngày liền kề — quyết định mỗi năm)
  - Giỗ Tổ Hùng Vương: 10/3 âm lịch
- **Điều 111**: Lễ rơi vào T7/CN → nghỉ bù vào ngày làm việc kế tiếp.
- **Cơ chế "hoán đổi"** (nghỉ nối): MOLISA ban hành **Thông báo** mỗi năm cho cán bộ, công chức — quyết định ngày làm việc nào hoán đổi với T7 trước/sau để tạo "long weekend" thúc đẩy tiêu dùng + du lịch. Doanh nghiệp tư nhân **không bắt buộc** áp dụng nhưng đa số follow.
- **Phạt vi phạm**: 10–20 triệu VND/lần cho việc không đảm bảo nghỉ tuần/lễ/năm.

### 1.2 Ví dụ thực tế 2024–2025 (cần model được)

| Năm  | Sự kiện   | Mô tả swap                                               |
| ---- | --------- | -------------------------------------------------------- |
| 2024 | 30/4–1/5  | T2 (29/4) đi làm bù → nghỉ 5 ngày 27/4–1/5               |
| 2025 | Tết Ất Tỵ | Nghỉ 9 ngày liên tục 25/1–2/2 (5 lễ + 4 thường)          |
| 2025 | 30/4–1/5  | Nghỉ 5 ngày 30/4–4/5; **làm bù T7 26/4 thay cho T6 2/5** |
| 2025 | 2/9       | Nghỉ 4 ngày                                              |

→ Pattern phải support: **một ngày trở thành holiday, một ngày khác (cùng năm) trở thành workday** (kể cả nếu đó là T7/CN).

### 1.3 Lịch tuần làm việc (workweek)

- **5-day** (T2–T6): hầu hết office, MNCs, ngân hàng quốc doanh
- **5.5-day** (T2–T6 full + sáng T7): banking, một số doanh nghiệp dịch vụ
- **6-day** (T2–T7): nhà máy, retail, truyền thống

→ Schema phải config được workweek pattern.

---

## 2. Library Evaluation — SKIPPED

Đã chốt scope **manual-only**. Không dùng `python-holidays`, `workalendar`, `Calendarific`. Lý do:

- Đơn giản hóa schema (không cần `source='auto'/'preset'`)
- Không phụ thuộc thư viện bên ngoài → ít risk break khi upgrade
- Admin ngân hàng chịu trách nhiệm dữ liệu → có audit trail rõ ràng (`created_by`/`updated_by`)
- VN swap-day không có nguồn 3rd-party reliable, không mất gì khi bỏ auto-import

**QoL nhỏ**: feature "Copy from previous year" trong UI cho phép admin clone lễ năm cũ → chỉnh sửa, không phải nhập từ đầu. Implement trong P2 (UI), không cần backend đặc biệt.

---

## 3. Domain Model

### 3.1 Entities

```
WorkSchedule (workspace_id?, name, week_pattern[7], timezone, is_default)
  └── Holiday (schedule_id, date, name)
  └── DayOverride (schedule_id, date, type: 'WORKDAY'|'HOLIDAY', reason, swap_with_date?)
```

Tất cả record đều do admin nhập tay. `BaseModel` của Plane đã có `created_by`/`updated_by` → audit có sẵn.

### 3.2 Resolution Algorithm (priority order)

```
def is_working_day(date, schedule):
    # 1. Manual override luôn thắng
    if override := DayOverride.get(schedule, date):
        return override.type == 'WORKDAY'
    # 2. Holiday list
    if Holiday.exists(schedule, date):
        return False
    # 3. Default workweek pattern (e.g. T2-T6 = True, T7/CN = False)
    return schedule.week_pattern[date.weekday()]
```

→ Single function. Idempotent. Cache-friendly (key = `(schedule_id, year)`).

### 3.3 ERD

```
┌─────────────────┐ 1     N ┌─────────────┐
│  WorkSchedule   │────────▶│  Holiday    │
│ - id (uuid)     │         │ - date      │
│ - workspace_fk  │         │ - name      │
│ - week_pattern  │         │ - source    │
│ - timezone      │         └─────────────┘
│ - is_default    │ 1     N ┌─────────────┐
└─────────────────┘────────▶│ DayOverride │
                            │ - date      │
                            │ - type      │
                            │ - swap_with │
                            └─────────────┘
```

---

## 4. Database Schema (PostgreSQL / Django)

```python
# apps/api/plane/db/models/business_calendar.py
class WorkSchedule(BaseModel):
    workspace = models.ForeignKey(
        "Workspace", on_delete=models.CASCADE, null=True,  # null = instance-level default
        related_name="work_schedules",
    )
    name = models.CharField(max_length=100)
    # 7 booleans: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    week_pattern = ArrayField(models.BooleanField(), size=7,
                              default=lambda: [True]*5 + [False]*2)
    timezone = models.CharField(max_length=64, default="Asia/Ho_Chi_Minh")
    is_default = models.BooleanField(default=False)
    country_code = models.CharField(max_length=2, default="VN")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "is_default"],
                                    condition=Q(is_default=True),
                                    name="unique_default_per_workspace"),
        ]


class Holiday(BaseModel):
    schedule = models.ForeignKey(WorkSchedule, on_delete=models.CASCADE,
                                 related_name="holidays")
    date = models.DateField()
    name = models.CharField(max_length=200)

    class Meta:
        unique_together = [("schedule", "date")]
        indexes = [models.Index(fields=["schedule", "date"])]


class DayOverride(BaseModel):
    """Override default workweek/holiday — used for MOLISA swap days."""
    schedule = models.ForeignKey(WorkSchedule, on_delete=models.CASCADE,
                                 related_name="overrides")
    date = models.DateField()
    type = models.CharField(max_length=10,
                            choices=[("WORKDAY", "Work day"),
                                     ("HOLIDAY", "Holiday")])
    reason = models.CharField(max_length=200, blank=True)
    swap_with_date = models.DateField(null=True, blank=True,
        help_text="Ngày được hoán đổi — chỉ để hiển thị/audit")

    class Meta:
        unique_together = [("schedule", "date")]
        indexes = [models.Index(fields=["schedule", "date"])]
```

**Indexes**: hàng năm chỉ ~15–20 record/schedule. `schedule_id + date` covering index đủ. Không cần partition.

---

## 5. Service API

```python
# apps/api/plane/utils/business_calendar.py
class BusinessCalendarService:
    @staticmethod
    @lru_cache(maxsize=1024)  # Cache (schedule_id, year) → set of dates
    def _holiday_set(schedule_id: UUID, year: int) -> dict[date, str]: ...

    @classmethod
    def is_working_day(cls, d: date, schedule_id: UUID | None = None) -> bool: ...

    @classmethod
    def next_working_day(cls, d: date, schedule_id: UUID | None = None) -> date: ...

    @classmethod
    def add_business_days(cls, d: date, n: int,
                          schedule_id: UUID | None = None) -> date: ...

    @classmethod
    def working_days_between(cls, start: date, end: date,
                             schedule_id: UUID | None = None) -> int: ...
```

**Cache invalidation**: khi `Holiday`/`DayOverride` save/delete → emit Django signal → `cache.delete_pattern("calendar:*:{year}")`. Use Redis (đã có `redis_instance`).

---

## 6. Celery Beat Integration

### 6.1 Vấn đề

`apps/api/plane/celery.py` hiện hardcode `crontab()` static. Không có cách nào kiểm tra working day mà không sửa code.

### 6.2 Option A — Decorator (recommended cho retrofit)

```python
# apps/api/plane/utils/celery_helpers.py
def working_day_required(schedule_resolver=None):
    """Skip task if today is not a working day in resolved schedule."""
    def decorator(task_fn):
        @functools.wraps(task_fn)
        def wrapper(*args, **kwargs):
            today = timezone.now().astimezone(VN_TZ).date()
            schedule_id = schedule_resolver(*args, **kwargs) if schedule_resolver else None
            if not BusinessCalendarService.is_working_day(today, schedule_id):
                logger.info(f"Skip {task_fn.__name__}: {today} not a working day")
                return
            return task_fn(*args, **kwargs)
        return wrapper
    return decorator
```

Apply:

```python
@app.task
@working_day_required()
def daily_capacity_report(): ...
```

**Ưu**: ít invasive, tasks tự khai báo. **Nhược**: phải đụng từng task.

### 6.3 Option B — Custom Scheduler

Subclass `celery.beat.PersistentScheduler` (hoặc `DatabaseScheduler` của django-celery-beat), override `apply_entry()` để filter trước khi dispatch:

```python
class WorkingDayAwareScheduler(DatabaseScheduler):
    def apply_entry(self, entry, producer=None):
        opts = entry.options or {}
        if opts.get("working_day_only"):
            today = timezone.now().astimezone(VN_TZ).date()
            if not BusinessCalendarService.is_working_day(today):
                return self.reserve(entry)
        return super().apply_entry(entry, producer)
```

**Ưu**: centralized, opt-in qua entry option. **Nhược**: bắt buộc migrate sang `django-celery-beat` (DB-backed scheduler) — hiện chưa có.

### 6.4 Khuyến nghị

**Pha 1** dùng decorator (low-risk). **Pha 2** migrate sang `django-celery-beat` + custom scheduler nếu cần tinh vi hơn (per-workspace schedules).

### 6.5 Tasks ứng viên áp dụng (từ `celery.py`)

| Task                                                        | Chạy mọi ngày? | Đề xuất                                                   |
| ----------------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `email_notification_task.stack_email_notification` (5 phút) | ✅ giữ         | Không skip — alert vẫn cần                                |
| `archive_and_close_old_issues` (1AM UTC)                    | ❓             | Skip nếu không phải working day VN — tránh archive vào lễ |
| `capacity_report` (nếu có)                                  | ✅ business    | Skip lễ                                                   |
| `cleanup_task.delete_api_logs`                              | ✅ infra       | Không skip                                                |
| `instance_traces` (6h)                                      | infra          | Không skip                                                |

→ Quy tắc: **infra/cleanup giữ nguyên, business/notification cân nhắc**.

---

## 7. God-Mode UI (apps/admin)

### 7.1 Nav: `Instance Settings → Business Calendar`

### 7.2 Pages

1. **Schedules list** — card view default schedule + per-workspace overrides
2. **Schedule detail** với tabs:
   - **Workweek**: 7 toggle (T2–CN)
   - **Holidays year view** — calendar grid 12 tháng, lễ highlight đỏ, override workday highlight cam (visual khớp nội dung MOLISA)
   - **Day Overrides table** — list ngày swap với cột: date, type (WORKDAY/HOLIDAY), swap_with, reason
3. **"Copy from previous year"** action button trên Holidays year view:
   - Chọn năm nguồn (e.g. 2025) → clone toàn bộ Holiday + DayOverride sang năm đích (e.g. 2026), shift date +365/+366
   - Sau đó admin chỉnh sửa cho match Thông báo MOLISA
   - Tránh phải nhập từ đầu mỗi năm

### 7.3 Components

- `@plane/propel/calendar` (nếu có) hoặc dựng `react-day-picker` + Tailwind
- MobX store: `BusinessCalendarStore` (`schedules`, `currentYear`, `holidays`, `overrides`)
- React Router v7 routes: `/admin/calendar`, `/admin/calendar/:scheduleId`

### 7.4 API endpoints (Django/DRF)

```
GET    /api/instance/calendar/schedules/
POST   /api/instance/calendar/schedules/
PATCH  /api/instance/calendar/schedules/:id/
GET    /api/instance/calendar/schedules/:id/holidays/?year=YYYY
POST   /api/instance/calendar/schedules/:id/holidays/
DELETE /api/instance/calendar/schedules/:id/holidays/:date/
POST   /api/instance/calendar/schedules/:id/overrides/
POST   /api/instance/calendar/schedules/:id/copy-year/    {from_year, to_year}
GET    /api/instance/calendar/check?date=YYYY-MM-DD       # debug helper
```

Permission: `IsInstanceAdmin` cho mutation. `IsAuthenticated` cho check.

---

## 8. Implementation Phases

| Phase                       | Scope                                                                                                              | Effort   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| **P0 — Foundation**         | Models + migrations + `BusinessCalendarService` + unit tests                                                       | 1.5 ngày |
| **P1 — API**                | DRF endpoints (CRUD schedule/holiday/override + check + copy-year) + admin permission                              | 1.5 ngày |
| **P2 — God-Mode UI**        | Schedules list + detail + workweek toggles + holidays calendar view + form CRUD + "Copy from previous year" action | 3 ngày   |
| **P3 — Celery integration** | `working_day_required` decorator + áp dụng cho tasks ứng viên + i18n VN                                            | 1.5 ngày |
| **P4 — Hardening**          | Cache invalidation signals + audit log review + smoke test end-to-end                                              | 1 ngày   |

**Total: ~8.5 ngày** (1 dev). Có thể parallel P2 và P3 nếu 2 dev → ~6 ngày calendar.

---

## 9. Risks & Mitigation

| Risk                                                       | Mitigation                                                                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MOLISA công bố trễ → admin chưa import được trước cuối năm | Default fallback = `python-holidays` (chỉ lễ chính, không swap). Có warning banner trong god-mode "Year YYYY chưa import — đang dùng baseline" |
| Multiple schedules per workspace conflict                  | Constraint: 1 default/workspace; explicit `schedule_id` luôn ưu tiên                                                                           |
| Timezone drift (server UTC vs VN +07)                      | Luôn convert sang `Asia/Ho_Chi_Minh` trước khi `.date()` cho mọi check; lưu test fixture rõ ràng                                               |
| Cache stale sau khi admin update                           | Django signal `post_save/post_delete` → invalidate Redis key                                                                                   |
| Audit/compliance — admin sửa lễ ai chịu trách nhiệm        | Lưu `created_by`/`updated_by` trên `Holiday`/`DayOverride` (đã có ở `BaseModel`)                                                               |
| Lunar holiday (10/3 âm)                                    | `python-holidays` đã handle qua `lunardate`/`lunarcalendar`; chỉ cần seed                                                                      |

---

## 10. Tham chiếu sản phẩm Việt (sao chép pattern)

| Sản phẩm                                                | Tính năng liên quan                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Tanca**, **Base.vn**, **MISA AMIS HRM**, **FastWork** | Đều có "Cấu hình ca làm việc" + "Quản lý ngày lễ" + "Hoán đổi ngày làm việc" — confirm pattern này là chuẩn ngành VN |
| **SAP HCM**                                             | Holiday Calendar + Work Schedule Rules + Day Substitution (T556\*, T508A) — same 3-tầng                              |
| **Oracle HCM**                                          | Public Holiday Calendar event update qua HRMS (OTL)                                                                  |

---

## 11. Khuyến nghị (TL;DR)

1. ✅ **Manual-only** — admin ngân hàng nhập tay 100% qua god-mode UI, không phụ thuộc thư viện/API.
2. ✅ **Schema 3-tầng** `WorkSchedule + Holiday + DayOverride` — đủ flexible cho 5/5.5/6-day workweek, swap day, lễ riêng workspace.
3. ✅ **Service-first** — `BusinessCalendarService.is_working_day()` là single API gọn, mọi job/feature gọi.
4. ✅ **Decorator pattern** — `@working_day_required()` thêm vào task nào cần, ít invasive.
5. ✅ **"Copy from previous year"** button — UX cứu cánh, không phải nhập 11+ ngày từ đầu mỗi năm.
6. ✅ **God-mode level** mặc định, support workspace-level override (multi-tenant SaaS).
7. ✅ **Audit có sẵn** — `BaseModel` của Plane đã có `created_by`/`updated_by`, biết ai khai báo gì khi nào.

---

## 12. Unresolved Questions

1. **Scope schedule**: chỉ 1 default cho instance, hay support nhiều schedule per-workspace ngay từ đầu? → ảnh hưởng UI complexity. Khuyến nghị MVP: 1 default instance-level, schema vẫn để optional `workspace_id` để mở rộng sau không cần migration.
2. **Permission**: instance admin only? Hay workspace admin cũng quản được schedule riêng workspace mình? Plane hiện có `IsInstanceAdmin` — cần confirm phạm vi.
3. **Áp dụng cho Cycles/Sprints không**: feature `cycles` của Plane hiện tính `end_date` raw. Có muốn tự động skew theo working day? (out of scope phase này, ghi nhận follow-up)
4. **Time tracking integration**: `worklog.py` đã có. Có muốn validate worklog không cho log vào holiday? (out of scope, natural extension)
5. **SOP duy trì hằng năm**: ai (role nào) trong ngân hàng trách nhiệm theo dõi Thông báo MOLISA và update god-mode? Cần internal process — không phải vấn đề kỹ thuật.

---

## Sources

- [Vietnam-Briefing — 2025 Public Holidays](https://www.vietnam-briefing.com/news/2025-vietnam-public-holidays-list.html/)
- [Vietnam-Briefing — 2024 30/4–1/5 Working Days Swap](https://www.vietnam-briefing.com/news/vietnam-advisory-on-swapping-of-working-days-around-april-30-and-may-1-2024-holidays.html/)
- [Vietnam Briefing — Public Holiday & Leave Guide](https://www.vietnam-briefing.com/doing-business-guide/vietnam/human-resources-and-payroll/a-guide-to-public-holiday-s-in-vietnam)
- [Wikipedia — Public holidays in Vietnam](https://en.wikipedia.org/wiki/Public_holidays_in_Vietnam)
- [HighFive Compliance — VN Holidays 2025–2026](https://highfive.global/compliance/vietnam-public-holidays-2025-2026-a-guide-for-employers/)
- [The Shiv — Vietnam Labour Law 2025](https://the-shiv.com/vietnams-labour-law/)
- [python-holidays (PyPI)](https://pypi.org/project/holidays/)
- [workalendar (GitHub)](https://github.com/workalendar/workalendar)
- [django-celery-beat docs](https://django-celery-beat.readthedocs.io/en/latest/)
- [Celery periodic tasks docs](https://docs.celeryq.dev/en/stable/userguide/periodic-tasks.html)
- [SAP — Public Holiday Calendar & Work Schedule Rules](https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-members/public-holiday-calendar-and-work-schedule-rules/ba-p/13235828)
- [Oracle — HRMS Public Holiday Calendar update](https://support.oracle.com/knowledge/Oracle%20E-Business%20Suite/2247623_1.html)
- [CodeProject — Business Day & Holiday Database Subsystem](https://www.codeproject.com/articles/Building-a-Business-Day-and-Holiday-Database-Subsy)
- [DatabaseZone — Designing the Calendar-Holiday DB](https://www.databasezone.com/techdocs/DesigningTheCalendarHolidayDb.html)
- [Calendarific — Global Holiday API](https://calendarific.com/)
