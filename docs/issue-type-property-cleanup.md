# Issue Type Property Value Cleanup

When an issue's type changes, property values for properties that don't exist on the new type become orphaned. This document describes how orphaned property values are automatically cleaned up.

## Problem

Issues have custom properties defined by their issue type. When an issue's type changes from Type A to Type B:

- Properties exclusive to Type A become invalid for the issue
- Property values for those exclusive properties should be removed
- Property values for properties shared between Type A and Type B should be preserved

Without cleanup, orphaned values pollute filter and query results.

## Solution Architecture

```
Issue Type Change Detection
         │
         ├── Individual save() ──► ChangeTrackerMixin detects type_id change
         │                              │
         │                              ├── compute_archive_html_for_issue()
         │                              │       (appends to self.description_html BEFORE save)
         │                              │
         │                              ├── super().save()  (single DB write)
         │                              │
         │                              └── _cleanup_orphaned_property_values()
         │                                          │
         │                                          ▼
         │                         IssuePropertyValue.cleanup_orphaned_for_issues()
         │                                   (delete-only, no archive)
         │
         └── Bulk update ──────► post_bulk_update signal
                                        │
                                        └── _handle_issue_type_change_on_bulk_update()
                                                    │
                                                    ▼
                              IssuePropertyValue.archive_and_cleanup_orphaned_for_issues()
                                   (archive via bulk_update + delete)
```

## Implementation Details

### 1. IssuePropertyValue Class Method

**Location**: `plane/ee/models/issue_properties.py`

Both individual save and bulk update use a class method on the `IssuePropertyValue` model:

```python
class IssuePropertyValue(WorkspaceBaseModel):
    # ... fields ...

    @classmethod
    def cleanup_orphaned_for_issues(cls, issue_ids, new_type_id):
        """
        Delete property values that are not valid for the new issue type.

        This is called when issue type changes (via save() or bulk update).
        Properties shared between old and new types are preserved.

        Args:
            issue_ids: List of issue IDs to clean up
            new_type_id: The new type ID (None if type is being unset)
        """
        if not issue_ids:
            return

        if not new_type_id:
            # Changed to null type - all property values are orphaned
            cls.objects.filter(issue_id__in=issue_ids).delete()
            return

        # Get valid property IDs for the new type
        valid_property_ids = set(
            IssueTypeProperty.objects.filter(
                issue_type_id=new_type_id, deleted_at__isnull=True
            ).values_list("property_id", flat=True)
        )

        # Delete values for properties not valid on new type (preserves shared properties)
        cls.objects.filter(issue_id__in=issue_ids).exclude(
            property_id__in=valid_property_ids
        ).delete()
```

### 2. Individual Issue Updates (via save())

**Location**: `plane/db/models/issue.py`

The `Issue` model uses `ChangeTrackerMixin` to detect when `type_id` changes.
Archive HTML is computed and appended to `description_html` **before** `super().save()`,
so the type change, archived description, and stripped text are all persisted in a single DB write:

```python
class Issue(ChangeTrackerMixin, ProjectBaseModel):
    TRACKED_FIELDS = ["type_id"]

    def save(self, *args, **kwargs):
        old_type_id = self.old_values.get("type_id") if self.has_changed("type_id") else None

        # Archive orphaned properties into description BEFORE save
        if old_type_id:
            from plane.ee.utils.issue_property_archiver import compute_archive_html_for_issue
            archive_html = compute_archive_html_for_issue(self.id, self.type_id, old_type_id)
            if archive_html:
                current_html = self.description_html or ""
                if current_html.strip() in ("", "<p></p>"):
                    self.description_html = archive_html
                else:
                    self.description_html = current_html + archive_html

        # Strip HTML AFTER potential archive append
        self.description_stripped = strip_tags(self.description_html) if self.description_html else None

        with transaction.atomic():
            super(Issue, self).save(*args, **kwargs)
            self._cleanup_orphaned_property_values(old_type_id)

    def _cleanup_orphaned_property_values(self, old_type_id):
        """Delete-only — archiving is handled before save()."""
        if not old_type_id:
            return
        from plane.ee.models import IssuePropertyValue
        IssuePropertyValue.cleanup_orphaned_for_issues([self.id], self.type_id)
```

### 3. Bulk Updates (via signal)

When `Issue.objects.filter(...).update(type_id=new_type_id)` is called, the `save()` method is bypassed. A signal handler catches these bulk updates:

```python
def _handle_issue_type_change_on_bulk_update(sender, model, objs, updated_fields=None, **kwargs):
    if updated_fields and "type_id" not in updated_fields:
        return

    from plane.ee.models import IssuePropertyValue

    objs_list = list(objs)
    if not objs_list:
        return

    new_type_id = objs_list[0].type_id
    issue_ids = [obj.id for obj in objs_list]

    IssuePropertyValue.cleanup_orphaned_for_issues(issue_ids, new_type_id)
```

The signal is connected at module load:

```python
from plane.db.signals import post_bulk_update
post_bulk_update.connect(_handle_issue_type_change_on_bulk_update, sender=Issue)
```

### 4. Signal Enhancement

**Location**: `plane/db/mixins.py`

The `BulkOperationHooks.update()` method passes `updated_fields` to the signal:

```python
post_bulk_update.send(
    sender=self.model,
    model=self.model,
    objs=objs,
    updated_fields=set(kwargs.keys()),  # Which fields were updated
)
```

## Cleanup Logic

### Determining Orphaned Properties

A property value is orphaned when:

1. The issue has changed type (or type set to null)
2. The property is NOT bound to the new type via `IssueTypeProperty`

The cleanup logic only needs to know the **new type** - it deletes any property values where the property is not valid for the new type. This automatically preserves shared properties (properties bound to both old and new types).

```python
# Get valid property IDs for the new type
valid_property_ids = set(IssueTypeProperty.objects.filter(
    issue_type_id=new_type_id
).values_list("property_id", flat=True))

# Delete values for properties NOT valid on new type
IssuePropertyValue.objects.filter(issue_id__in=issue_ids).exclude(
    property_id__in=valid_property_ids
).delete()
```

### Soft Deletion

Orphaned values are soft deleted (not hard deleted):

```python
IssuePropertyValue.objects.filter(
    issue_id=issue_id,
    property_id__in=orphaned_property_ids
).delete()  # Soft delete is default
```

## Edge Cases

| Scenario          | Behavior                                                   |
| ----------------- | ---------------------------------------------------------- |
| Type A → Type B   | Delete values for properties exclusive to Type A           |
| Type A → null     | Delete all property values (no type = no valid properties) |
| null → Type A     | No cleanup (no old type to clean up from)                  |
| Type A → Type A   | No cleanup (type unchanged)                                |
| Shared properties | Preserved (property exists on both types)                  |

## Data Migration

### 0060: Backfill and Cleanup Issue Type Properties

**File**: `plane/ee/migrations/0060_backfill_and_cleanup_issue_type_properties.py`

#### Production Impact (checked on January 15, 2026)

| Operation                                | Records Affected |
| ---------------------------------------- | ---------------- |
| IssueTypeProperty backfill (create)      | 25,168           |
| IssuePropertyValue cleanup (soft delete) | 3,684            |

This migration performs two operations in sequence:

**Step 1: Backfill IssueTypeProperty bindings**

Create `IssueTypeProperty` bindings for historical `IssueProperty` records that only have `issue_type` FK set. `IssueTypeProperty` was added recently, so older properties don't have bindings. The cleanup logic relies on `IssueTypeProperty` to determine valid properties.

```python
# Bulk create missing bindings
IssueTypeProperty.objects.bulk_create(bindings_to_create, batch_size=1000)
```

**Step 2: Cleanup orphaned property values**

Soft delete existing orphaned `IssuePropertyValue` records. Historical data may have orphaned values from type changes that occurred before this feature was implemented.

```python
# Single query using EXISTS subquery
orphaned_with_type = IssuePropertyValue.objects.filter(
    issue__type_id__isnull=False,
    deleted_at__isnull=True,
).exclude(
    Exists(valid_binding_subquery)
)
orphaned_with_type.update(deleted_at=timezone.now())
```

## Testing

Unit tests are located at: `plane/tests/unit/models/test_issue_type_property_cleanup.py`

### Test Cases

**Individual save() tests:**

- `test_type_change_deletes_orphaned_values` - Type A → B deletes A-only values
- `test_type_change_preserves_shared_property_values` - Shared properties preserved
- `test_type_change_to_null_deletes_all_values` - Type → null deletes all
- `test_null_to_type_does_not_delete_anything` - null → Type doesn't delete
- `test_same_type_does_not_trigger_cleanup` - No change = no cleanup

**Bulk update tests:**

- `test_bulk_update_type_change_deletes_orphaned_values`
- `test_bulk_update_preserves_shared_property_values`
- `test_bulk_update_to_null_deletes_all_values`
- `test_bulk_update_non_type_field_does_not_trigger_cleanup`

### Running Tests

```bash
pytest plane/tests/unit/models/test_issue_type_property_cleanup.py -v
```

## Files Modified/Created

| File                                                                     | Change                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `plane/db/models/issue.py`                                               | Added `ChangeTrackerMixin`, cleanup method, signal handler |
| `plane/db/mixins.py`                                                     | Added `updated_fields` to `post_bulk_update` signal        |
| `plane/ee/models/__init__.py`                                            | Exported `IssueTypeProperty`                               |
| `plane/ee/migrations/0060_backfill_and_cleanup_issue_type_properties.py` | Created                                                    |
| `plane/tests/unit/models/test_issue_type_property_cleanup.py`            | Created                                                    |

## Future Considerations

When `IssueProperty.issue_type` FK is removed:

1. The backfill migration becomes unnecessary (can be squashed)
2. The cleanup logic continues working (uses `IssueTypeProperty`)
3. `sync_to_issue_type_properties()` in `IssueProperty.save()` should be removed
