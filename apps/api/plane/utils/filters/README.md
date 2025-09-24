# Plane Filters Module

Advanced filtering for Django REST Framework views using a JSON grammar with logical operators. Leaves are evaluated by your `FilterSet`, then combined using queryset combinators (`|`, `&`) and negation to produce a single SQL statement.

## How it works

- The backend reads `?filter=<JSON>` with operators `and`, `or`, `not`.
- **Branch-based filtering**: Field conditions within logical branches are collected and applied together for optimal performance:
  - `and` → field conditions collected per branch and applied together via `DjangoFilterBackend`
  - `or` → child querysets combined with union (`qs1 | qs2`)
  - `not` → efficient subquery-based negation (`WHERE pk NOT IN (SELECT pk FROM ...)`)
- Your `filterset_class` handles:
  - allowed fields, validation and type conversion
  - custom method filters
- Logical operations requiring set operations are evaluated separately and combined as needed
- Eager loading and annotations are not automatically re-applied. Apply
  `select_related`, `prefetch_related`, and any `annotate` explicitly in the
  view after filtering.

PostgreSQL 15+ executes this as one query and optimizes set operations well.

## Performance

- **Lazy evaluation**: All operations maintain Django's lazy querysets until final execution
- **Branch-based filtering**: Field conditions within AND branches are collected and applied together, reducing intermediate querysets
- **Optimized NOT operations**: Uses efficient subqueries instead of large IN clauses for better performance on large datasets
- **Single SQL query**: Complex nested filters compile to one optimized SQL statement
- **Database-level optimization**: Set operations (`|`, `&`) are handled by the database engine
- **Memory efficient**: No intermediate result loading during filter combination
- **Reduced query complexity**: AND operations with multiple field conditions generate fewer intermediate queries

### Performance improvements with branch-based filtering

**Before (leaf-based)**:

```json
{ "and": [{ "status": "open" }, { "priority": "high" }, { "assignee": "john" }] }
```

- Creates 3 separate querysets and intersects them (`QuerySet1 & QuerySet2 & QuerySet3`)

**After (branch-based)**:

```json
{ "and": [{ "status": "open" }, { "priority": "high" }, { "assignee": "john" }] }
```

- Collects all field conditions and applies in single query with `status=open AND priority=high AND assignee=john`

### Performance considerations

- NOT operations scale well with subquery optimization
- OR operations still require set unions for optimal logical separation
- AND operations benefit significantly from branch-based field collection
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
    "and": [{ "priority": "medium" }, { "not": { "state_group": "completed" } }, { "not": { "assignee_id": null } }]
  }
  ```

- NOT with complex nested conditions:

  ```json
  {
    "not": {
      "and": [{ "assignee_id": "user-123" }, { "or": [{ "priority": "low" }, { "state_group": "backlog" }] }]
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

- Branch-based filtering optimization example:

  ```json
  {
    "and": [
      { "status": "open", "priority": "high", "project_id": "abc-123" },
      { "assignee_id": "user-456" },
      { "created_at__gte": "2023-01-01" },
      { "or": [{ "label_id": "bug-label" }, { "label_id": "urgent-label" }] }
    ]
  }
  ```

  **Performance**: Field conditions (`status`, `priority`, `project_id`, `assignee_id`, `created_at__gte`) are collected and applied in a single query, while the OR operation is evaluated separately and intersected.

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

### Branch-based filtering implementation

- **AND operations**: Field conditions within the same logical branch are collected and applied together
- **Mixed branches**: Logical operations (OR/NOT) within AND branches are evaluated separately and intersected
- **Optimization**: Reduces intermediate queryset creation and database round-trips
- **Compatibility**: Maintains full backward compatibility with existing filter behavior
- **Separation**: Pure field conditions vs logical operations are handled differently for optimal performance

### NOT operation implementation

- Uses `WHERE pk NOT IN (SELECT pk FROM ...)` subquery pattern
- Avoids memory-intensive `values_list()` evaluation
- Scales efficiently with large datasets
- Maintains lazy queryset evaluation throughout

### FilterSet integration

- Delegates leaf evaluation to `DjangoFilterBackend`
- Branch-based collection respects all FilterSet configurations and custom methods
- Preserves field validation and type conversion
- Works with any existing FilterSet implementation

### Query optimization

- Complex filters compile to single SQL statements
- Branch-based filtering reduces query complexity for AND operations
- Database handles set operations natively
- Query planner optimizes subqueries and joins
- No Python-level result iteration or memory loading

## Legacy Filter Conversion

The `LegacyToRichFiltersConverter` provides automated conversion from legacy filter formats to the rich filter JSON structure.

### Usage

```python
from plane.utils.filters.converters import LegacyToRichFiltersConverter

converter = LegacyToRichFiltersConverter()

# Basic conversion
legacy_filters = {
    'state': ['uuid1', 'uuid2'],
    'priority': ['high']
}
rich_filters = converter.convert(legacy_filters)
# Result: {
#     "and": [
#         {"state_id__in": ["uuid1", "uuid2"]},
#         {"priority__in": ["high"]}  # List value uses __in
#     ]
# }

# Strict mode for validation
try:
    result = converter.convert(legacy_filters, strict=True)
except ValueError as e:
    print(f"Validation errors: {e}")

# Operator selection examples
list_value_example = {'priority': ['high']}  # List value
result1 = converter.convert(list_value_example)
# Result: {"priority__in": ["high"]}

non_list_value_example = {'priority': 'high'}  # Non-list value
result2 = converter.convert(non_list_value_example)
# Result: {"priority__exact": "high"}

# Complex real-world example
complex_legacy = {
    'state': ['2cf49aa5-7da6-40d2-ab42-4620804e78cc',
              'cdbed843-a6e2-41c8-9de7-3c611977c2e1',
              '3ecb3bd9-9ed7-4549-9c28-bc37c0e8ea97',
              '18f03304-0e28-49c8-863c-b1279a9ae998',
              'ed7ff852-42da-47dc-a51a-664d601cd5b6'],
    'priority': ['urgent', 'high', 'medium', 'low'],
    'assignees': ['4ea4d833-a15c-4ce5-a8b9-fa735ee8bfad'],
    'start_date': ['2_weeks;after;fromnow'],
    'target_date': ['2_weeks;after;fromnow']
}
rich_result = converter.convert(complex_legacy)
# Result: {
#     "and": [
#         {"state_id__in": [
#             "2cf49aa5-7da6-40d2-ab42-4620804e78cc",
#             "cdbed843-a6e2-41c8-9de7-3c611977c2e1",
#             "3ecb3bd9-9ed7-4549-9c28-bc37c0e8ea97",
#             "18f03304-0e28-49c8-863c-b1279a9ae998",
#             "ed7ff852-42da-47dc-a51a-664d601cd5b6"
#         ]},
#         {"priority__in": ["urgent", "high", "medium", "low"]},
#         {"assignee_id__in": ["4ea4d833-a15c-4ce5-a8b9-fa735ee8bfad"]}
#         # Note: start_date and target_date are skipped due to relative date format
#     ]
# }
```

### Field Mappings

| Legacy Field   | Rich Filter Field | Type   | Notes                                      |
| -------------- | ----------------- | ------ | ------------------------------------------ |
| `state`        | `state_id`        | UUID   | Issue state ID                             |
| `labels`       | `label_id`        | UUID   | Issue label ID                             |
| `cycle`        | `cycle_id`        | UUID   | Cycle ID                                   |
| `module`       | `module_id`       | UUID   | Module ID                                  |
| `assignees`    | `assignee_id`     | UUID   | User ID                                    |
| `mentions`     | `mention_id`      | UUID   | Mentioned user ID                          |
| `created_by`   | `created_by_id`   | UUID   | Creator user ID                            |
| `project`      | `project_id`      | UUID   | Project ID                                 |
| `team_project` | `team_project_id` | UUID   | Team project ID                            |
| `issue_type`   | `type_id`         | UUID   | Issue type ID (e.g., bug, feature, task)   |
| `state_group`  | `state_group`     | String | State group name                           |
| `priority`     | `priority`        | String | Priority level                             |
| `type`         | `state_group_set` | String | Preset state group (e.g., active, backlog) |
| `start_date`   | `start_date`      | Date   | See date handling below                    |
| `target_date`  | `target_date`     | Date   | See date handling below                    |

**⚠️ Important Note**: The legacy fields `issue_type` and `type` map to completely different concepts despite their similar names:

- `issue_type` → `type_id`: The actual issue type (bug, feature, task) as a UUID
- `type` → `state_group_set`: A preset filter for state groups (active, backlog, etc.) as a string

### Date Field Conversion

The converter handles complex date formats from legacy filters:

#### Simple Dates

```python
# Legacy: {'start_date': ['2023-01-01']}
# Rich: {"start_date__exact": "2023-01-01"}
```

#### Directional Dates

```python
# Legacy: {'start_date': ['2023-01-01;after']}
# Rich: {"start_date__gte": "2023-01-01"}

# Legacy: {'start_date': ['2023-12-31;before']}
# Rich: {"start_date__lte": "2023-12-31"}
```

#### Date Ranges

```python
# Legacy: {'start_date': ['2023-01-01;after', '2023-12-31;before']}
# Rich: {"start_date__range": ["2023-01-01", "2023-12-31"]}
```

#### Relative Dates

```python
# Legacy: {'start_date': ['2_weeks;after;fromnow']}
# Rich: {} (skipped - relative dates are not converted)
```

**⚠️ Note**: Relative date patterns (e.g., "2_weeks;after;fromnow") are not supported and will be skipped during conversion. Fields containing relative dates will not appear in the rich filter output.

#### Multiple Directional Dates

When multiple directional dates of the same type are provided, the converter applies min/max logic:

```python
# Multiple "after" dates - uses MAX (most restrictive)
# Legacy: {'start_date': ['2023-01-01;after', '2023-02-01;after']}
# Rich: {"start_date__gte": "2023-02-01"}  # Uses latest/most restrictive date

# Multiple "before" dates - uses MIN (most restrictive)
# Legacy: {'target_date': ['2023-12-31;before', '2023-11-30;before']}
# Rich: {"target_date__lte": "2023-11-30"}  # Uses earliest/most restrictive date
```

**Behavior**:

- **Non-strict mode**: Silently applies min/max logic
- **Strict mode**: Raises `ValueError` to alert about multiple conditions

### Validation Features

- **UUID Validation**: Ensures proper UUID format for ID fields
- **Choice Validation**: Validates against predefined valid values
- **Date Validation**: Uses `dateutil.parser` for flexible date format validation, supporting:
  - Standard ISO formats: `2023-01-01`, `2023-01-01T12:30:00Z`
  - Alternative separators: `2023/01/01`, `2023.01.01`
  - US formats: `01-01-2023`, `01/01/2023`
  - Natural language: `January 1, 2023`, `Jan 1, 2023`
  - Mixed formats: `2023-Jan-01`, `20230101`
  - Timezone-aware: `2023-01-01T12:30:00+05:30`
  - And many more formats automatically recognized by dateutil
- **Error Modes**:
  - **Non-strict (default)**: Silently filters out invalid values
  - **Strict**: Raises `ValueError` with detailed error messages

### Error Handling

```python
# Multiple complex date conditions
legacy_filters = {
    'start_date': ['2023-01-01;after', '2023-06-01;before', '2023-03-15']
}
# Result: {} (skipped - multiple complex date conditions not supported)

# Malformed date patterns
legacy_filters = {
    'start_date': ['2023-01-01;invalid_direction']
}
# Raises: ValueError("Invalid date direction: invalid_direction...")

# Invalid date formats
legacy_filters = {
    'start_date': ['invalid-date-format']
}
# Raises: ValueError("Invalid date format: invalid-date-format")

# Invalid date in directional filter
legacy_filters = {
    'start_date': ['2023-99-99;after']
}
# Raises: ValueError("Invalid date format in directional date: 2023-99-99")

# Multiple directional dates of same type (strict mode)
legacy_filters = {
    'start_date': ['2023-01-01;after', '2023-02-01;after']
}
# Strict mode raises: ValueError("Multiple 'after' date conditions for start_date...")
# Non-strict mode uses: max date (2023-02-01) for most restrictive filter
```

### Output Format

The converter always returns valid rich filter format:

- **Single condition**: Direct field filter (e.g., `{"priority__exact": "high"}` or `{"priority__in": ["high"]}`)
- **Multiple conditions**: Wrapped in `{"and": [...]}`
- **Non-date fields**:
  - List values → `__in` operator (e.g., `{'priority': ['high']}` → `{"priority__in": ["high"]}`)
  - Non-list values → `__exact` operator (e.g., `{'priority': 'high'}` → `{"priority__exact": "high"}`)
- **Date fields**: Use appropriate operators (`__exact`, `__gte`, `__lte`, `__range`)
- **Empty result**: `{}` for no valid filters

This ensures compatibility with the `ComplexFilterBackend` for seamless data migration.

### Configuration and Customization

The `LegacyToRichFiltersConverter` supports flexible configuration to handle specific requirements:

#### Basic Configuration

```python
from plane.utils.filters.converters import LegacyToRichFiltersConverter

# Use default configuration (most common case)
converter = LegacyToRichFiltersConverter()

# Add custom field mappings while keeping defaults
converter = LegacyToRichFiltersConverter(
    field_mappings={'custom_status': 'status_id'},
    uuid_fields={'status_id'}
)

# Override specific choices while keeping defaults
converter = LegacyToRichFiltersConverter(
    valid_choices={'priority': ['critical', 'high', 'medium', 'low']}
)

# Add custom date fields
converter = LegacyToRichFiltersConverter(
    date_fields={'custom_deadline'}
)
```

#### Complete Replacement Mode

```python
# Replace all defaults (use with caution)
converter = LegacyToRichFiltersConverter(
    field_mappings={'status': 'status_field'},
    uuid_fields={'status_field'},
    valid_choices={'status': ['active', 'inactive']},
    date_fields={'deadline'},
    extend_defaults=False  # This replaces all defaults
)
```

#### Runtime Configuration Updates

```python
converter = LegacyToRichFiltersConverter()

# Add individual configurations
converter.add_field_mapping('new_field', 'new_field_id')
converter.add_uuid_field('new_field_id')
converter.add_choice_field('category', ['bug', 'feature', 'improvement'])
converter.add_date_field('due_date')

# Bulk updates
converter.update_mappings(
    field_mappings={'field1': 'field1_id', 'field2': 'field2_id'},
    uuid_fields={'field1_id', 'field2_id'},
    valid_choices={'field1': ['option1', 'option2']},
    date_fields={'field2_id'}
)
```

#### Configuration Parameters

| Parameter         | Type                   | Default Behavior | Description                                                  |
| ----------------- | ---------------------- | ---------------- | ------------------------------------------------------------ |
| `field_mappings`  | `Dict[str, str]`       | Extend defaults  | Legacy key → Rich field name mappings                        |
| `uuid_fields`     | `set`                  | Extend defaults  | Fields requiring UUID validation                             |
| `valid_choices`   | `Dict[str, List[str]]` | Extend defaults  | Valid choices for choice fields                              |
| `date_fields`     | `set`                  | Extend defaults  | Fields requiring date processing                             |
| `extend_defaults` | `bool`                 | `True`           | If `True`, merge with defaults; if `False`, replace entirely |

#### Migration-Specific Examples

```python
# Project with custom issue types
converter = LegacyToRichFiltersConverter(
    field_mappings={'issue_category': 'category_id'},
    uuid_fields={'category_id'},
    valid_choices={'issue_category': ['epic', 'story', 'task', 'bug']}
)

# Legacy system with different priority levels
converter = LegacyToRichFiltersConverter(
    valid_choices={'priority': ['p0', 'p1', 'p2', 'p3', 'p4']}
)

# System with additional date fields
converter = LegacyToRichFiltersConverter(
    field_mappings={'due_date': 'deadline', 'review_date': 'review_deadline'},
    date_fields={'deadline', 'review_deadline'}
)
```

#### Best Practices

1. **Default Configuration**: Use default constructor for standard Plane migrations
2. **Extend, Don't Replace**: Use `extend_defaults=True` (default) to preserve existing functionality
3. **Validation Consistency**: Ensure custom UUID and choice fields match your FilterSet definitions
4. **Test Thoroughly**: Always test custom configurations with representative legacy data
5. **Document Changes**: Record custom mappings for future maintenance

## URL length

- Typical safe budget for GET URLs through browsers/CDNs/LBs is 4–8 KB. This JSON grammar is compact; if you approach limits, consider:
  - shortening keys (`and`→`a`, `or`→`o`, `not`→`n`),
  - using a saved filter id (`?filter_id=abc`), or
  - a POST endpoint with JSON body.
