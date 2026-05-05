# Phase 2: DROP V1 Database Tables

**Priority:** High | **Status:** ✅ Complete

## Overview

Create Django migration to drop V1 tables: `AnalyticsDashboard` + `AnalyticsDashboardWidget`.

## Steps

### 2.1 Create migration file

Create `apps/api/plane/db/migrations/0127_drop_analytics_dashboard_tables.py`:

```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("db", "0126_dashboard_dashboardwidget_and_more"),
    ]
    operations = [
        migrations.DeleteModel(name="AnalyticsDashboardWidget"),
        migrations.DeleteModel(name="AnalyticsDashboard"),
    ]
```

**Order matters:** Delete `Widget` first (has FK to `Dashboard`).

## Todo

- [ ] Create migration `0127_drop_analytics_dashboard_tables.py`
- [ ] Verify migration dependency chain: `0120` → `0126` → `0127`

## Success Criteria

- Migration file created
- `python manage.py showmigrations` shows new migration
- Tables will be dropped on next `migrate` run
