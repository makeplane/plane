# Plane Filters Module

Advanced filtering for Django REST Framework views using a JSON grammar with logical operators. Leaves are evaluated by your `FilterSet`, then combined using queryset combinators (`|`, `&`) and negation to produce a single SQL statement.

## How it works

- The backend reads `?filter=<JSON>` with operators `and`, `or`, `not`.
- Each leaf dict is serialized and passed through `DjangoFilterBackend`, so your `filterset_class` handles:
  - allowed fields, validation and type conversion
  - custom method filters
- Child querysets are combined with queryset combinators:
  - `or` → `qs1 | qs2`
  - `and` → `qs1 & qs2`
  - `not` → efficient subquery-based negation (`WHERE pk NOT IN (SELECT pk FROM ...)`)
- Eager loading and annotations are not automatically re-applied. Apply
  `select_related`, `prefetch_related`, and any `annotate` explicitly in the
  view after filtering.

PostgreSQL 15+ executes this as one query and optimizes set operations well.

## Performance

- **Lazy evaluation**: All operations maintain Django's lazy querysets until final execution
- **Optimized NOT operations**: Uses efficient subqueries instead of large IN clauses for better performance on large datasets
- **Single SQL query**: Complex nested filters compile to one optimized SQL statement
- **Database-level optimization**: Set operations (`|`, `&`) are handled by the database engine
- **Memory efficient**: No intermediate result loading during filter combination

### Performance considerations

- NOT operations scale well with subquery optimization
- OR/AND combinations benefit from database query planner optimization
- Range filters (`__range`) are passed directly to FilterSet for optimal handling
- Field validation happens before query execution to fail fast

## Usage

```python
from django_filters.rest_framework import DjangoFilterBackend
from plane.utils.filters import ComplexFilterBackend
from .issue_filterset import IssueFilterSet

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer

    # Complex JSON filters + classic FilterSet params
    filter_backends = (ComplexFilterBackend, DjangoFilterBackend)
    filterset_class = IssueFilterSet

    # No complex_filter_fields needed – FilterSet defines the allow‑list
```

### Applying eager loading and annotations in views

```python
class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer

    filter_backends = (ComplexFilterBackend, DjangoFilterBackend)
    filterset_class = IssueFilterSet

    def get_queryset(self):
        qs = super().get_queryset()
        # Apply complex filter via backends; then add eager loading/annotations
        qs = self.filter_queryset(qs)
        return (
            qs.select_related("project", "state")
              .prefetch_related("labels", "assignees")
              .annotate(has_parent=~Q(parent__isnull=True))
        )
```

## JSON filter syntax

Pass a JSON object in the `filter` query parameter:

```
?filter={"or":[{"name__contains":"Bug"},{"priority":"high"}]}
```

Supported operators:

- `and`: all conditions must match
- `or`: any condition may match
- `not`: negates a condition

### Examples

- Simple field filter:

  ```
  ?filter={"name__contains":"Bug"}
  ```

- Logical OR:

  ```
  ?filter={"or":[{"name__contains":"Bug"},{"priority":"high"}]}
  ```

- Logical AND:

  ```
  ?filter={"and":[{"assignees":"<user-id>"},{"priority":"high"}]}
  ```

- Logical NOT:

  ```
  ?filter={"not":{"state__group":"completed"}}
  ```

- Nested:

  ```
  ?filter={"and":[
    {"created_at__gte":"2023-01-01"},
    {"or":[{"state__name":"In Progress"},{"and":[{"state__name":"Done"},{"completed_at__gte":"2023-03-01"}]}]},
    {"not":{"assignees":null}}
  ]}
  ```

### Advanced NOT examples

- NOT within AND conditions:

  ```json
  {
    "and": [
      {
        "or": [
          { "state_id": "a094a8a4-4bba-43f5-9c79-def3a0c3a576" },
          { "state_id": "1d1ac070-1c5e-42bf-b597-657bbd3c9242" }
        ]
      },
      { "label_id": "a6b0546c-6641-404a-951f-aa86564c5fa3" },
      {
        "not": {
          "priority": "high"
        }
      }
    ]
  }
  ```

- Multiple NOT conditions:

  ```json
  {
    "and": [
      { "priority": "medium" },
      { "not": { "state_group": "completed" } },
      { "not": { "assignee_id": null } }
    ]
  }
  ```

- NOT with complex nested conditions:

  ```json
  {
    "not": {
      "and": [
        { "assignee_id": "user-123" },
        { "or": [{ "priority": "low" }, { "state_group": "backlog" }] }
      ]
    }
  }
  ```

### Ranges

- Using `__range` (two values required):

  ```
  ?filter={"created_at__range":["2023-01-01","2023-01-31"]}
  ```

#### More range examples

- Numeric range using `__range`:

  ```
  ?filter={"sequence_id__range":[100,200]}
  ```

- Multiple field ranges with OR:

  ```
  ?filter={"or":[{"sequence_id__range":[100,200]},{"sort_order__range":[0,1000]}]}
  ```

- Combining range with other conditions:

  ```
  ?filter={"and":[{"priority":"high"},{"created_at__range":["2023-01-01","2023-01-31"]}]}
  ```

- Using NOT with range:

  ```
  ?filter={"not":{"created_at__range":["2023-01-01","2023-01-31"]}}
  ```

- Using gte/lte pairs instead of range:

  ```
  ?filter={"and":[{"sequence_id__gte":100},{"sequence_id__lte":200}]}
  ```

- Excluding a sub-range:

  ```
  ?filter={"and":[{"sequence_id__gt":100},{"not":{"and":[{"sequence_id__gte":150},{"sequence_id__lte":175}]}}]}
  ```

- Combined field ranges:

  ```
  ?filter={"and":[{"and":[{"start_date__gte":"2023-01-01"},{"start_date__lte":"2023-01-31"}]},{"and":[{"target_date__gte":"2023-02-15"},{"target_date__lte":"2023-03-15"}]}]}
  ```

### Classic (non‑JSON) filtering

Classic query parameters are still supported via `DjangoFilterBackend`:

```
?priority=high&sequence_id__gte=100
```

## Constraints and validation

- Only filters declared in your view's `filterset_class` are accepted. Any other key raises a validation error.
- Leaf values are validated and coerced by the `FilterSet` (booleans, UUIDs, dates, etc.).
- **Field validation**: All field names must exist in the FilterSet's `base_filters`
- **Type safety**: Invalid JSON structure or field types will raise `ValidationError`
- **Range validation**: `__range` lookups require exactly 2 values

## More examples

- Multiple date ranges (created in January OR completed in February):

  ```
  ?filter={"or":[{"and":[{"created_at__gte":"2023-01-01"},{"created_at__lte":"2023-01-31"}]},{"and":[{"completed_at__gte":"2023-02-01"},{"completed_at__lte":"2023-02-28"}]}]}
  ```

- Date range with additional conditions:

  ```
  ?filter={"and":[{"created_at__gte":"2023-01-01"},{"created_at__lte":"2023-01-31"},{"priority":"high"},{"state__group":"started"}]}
  ```

- Exclude completed issues within a date range:

  ```
  ?filter={"not":{"and":[{"completed_at__gte":"2023-01-01"},{"completed_at__lte":"2023-01-31"}]}}
  ```

- (High priority AND "bug" label) OR (done AND assigned to me):

  ```
  ?filter={"or":[{"and":[{"priority":"high"},{"labels":"<label-id>"}]},{"and":[{"state__group":"completed"},{"assignees":"<user-id>"}]}]}
  ```

- NOT in completed state AND has comments since a date:

  ```
  ?filter={"and":[{"not":{"state__group":"completed"}},{"issue_comments__created_at__gte":"2023-04-01"}]}
  ```

- Triple-nested example:

  ```
  ?filter={"or":[{"priority":"high"},{"and":[{"not":{"state__group":"backlog"}},{"or":[{"parent__isnull":false},{"is_draft":true}]}]}]}
  ```

- De Morgan example (NOT(assigned to X AND has bug)):

  ```
  ?filter={"not":{"and":[{"assignees":"<user-id>"},{"labels":"<label-id>"}]}}
  ```

## Technical notes

### NOT operation implementation

- Uses `WHERE pk NOT IN (SELECT pk FROM ...)` subquery pattern
- Avoids memory-intensive `values_list()` evaluation
- Scales efficiently with large datasets
- Maintains lazy queryset evaluation throughout

### FilterSet integration

- Delegates leaf evaluation to `DjangoFilterBackend`
- Respects all FilterSet configurations and custom methods
- Preserves field validation and type conversion
- Works with any existing FilterSet implementation

### Query optimization

- Complex filters compile to single SQL statements
- Database handles set operations natively
- Query planner optimizes subqueries and joins
- No Python-level result iteration or memory loading

## URL length

- Typical safe budget for GET URLs through browsers/CDNs/LBs is 4–8 KB. This JSON grammar is compact; if you approach limits, consider:
  - shortening keys (`and`→`a`, `or`→`o`, `not`→`n`),
  - using a saved filter id (`?filter_id=abc`), or
  - a POST endpoint with JSON body.
