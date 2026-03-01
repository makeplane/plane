# Utils Module

Shared utility library for the Plane application.

## Purpose

Core utility functions and classes used across all Plane modules.

## Key Components

### Pagination

```python
class BasePaginator:
    # Cursor-based pagination with CursorResult
    def paginate(self, queryset, cursor=None, per_page=100):
        ...
```

### Filtering

- FilterSet for defining filters
- FilterBackend for DRF integration
- Extended variants for complex filtering

### Permissions

- Workspace-level permission checks
- Project-level permission checks
- Page-level permission checks

### Validators

- `content_validator.py`: Content validation
- `email_validator.py`: Email format validation
- `path_validator.py`: File path validation

### Data Processing

- `issue_filters.py`: Complex issue filtering
- `grouper.py`: Data grouping utilities
- `cycle_transfer_issues.py`: Transfer issues between cycles

### Analytics

- `analytics_events.py`: Event tracking
- `analytics_plot.py`: Data visualization
- `build_chart.py`: Chart generation

### Exception Handling

```python
from plane.utils.exception_logger import log_exception

try:
    # code
except Exception as e:
    log_exception(e)
```

## Usage Pattern

```python
from plane.utils.paginator import BasePaginator
from plane.utils.issue_filters import issue_filters
from plane.utils.exception_logger import log_exception
```
