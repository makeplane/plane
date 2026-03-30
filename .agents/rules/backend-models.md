<!-- Scope: plane/db/** -->

# Backend Models & Custom Managers

## Model Hierarchy

```python
# mixins.py
class TimeAuditModel:     # → created_at, updated_at (auto)
class UserAuditModel:     # → created_by, updated_by (auto via crum)
class SoftDeleteModel:    # → deleted_at, objects (SoftDeletionManager), all_objects
class AuditModel(TimeAuditModel, UserAuditModel, SoftDeleteModel): ...

# base.py
class BaseModel(AuditModel):
    id = UUIDField(primary_key=True, default=uuid4)
    # objects = SoftDeletionManager (auto-excludes deleted_at)
    # all_objects = models.Manager (includes soft-deleted)

# project.py
class ProjectBaseModel(BaseModel):
    project = ForeignKey(Project, on_delete=CASCADE)
    workspace = ForeignKey(Workspace, on_delete=CASCADE)
    # workspace auto-set from project on save()
```

### When to use which:

- **`BaseModel`** — workspace-level entities (Department, StaffProfile)
- **`ProjectBaseModel`** — project-scoped entities (Issue, State, Label, Cycle, Module)
  - Auto-sets `workspace = self.project.workspace` on save — don't set manually

### ChangeTrackerMixin

```python
class MyModel(ChangeTrackerMixin, ProjectBaseModel):
    TRACKED_FIELDS = ["name", "status"]
    # On save, self.changed_fields contains set of modified field names
```

## Custom Managers — CRITICAL

### Issue

```python
Issue.objects          # SoftDeletionManager — excludes deleted_at only
Issue.issue_objects    # IssueManager — excludes deleted + triage + archived + draft
Issue.all_objects      # Default — includes everything (including soft-deleted)
```

**Rule**: Use `Issue.issue_objects` for user-facing queries. Use `Issue.objects` only when you explicitly need archived/draft/triage items.

### State

```python
State.objects            # StateManager — excludes deleted + triage states
State.all_state_objects  # Default — includes triage states
State.triage_objects     # Only triage states
```

### General pattern:

```python
MyModel.objects      # SoftDeletionManager (default) — auto-excludes deleted_at IS NOT NULL
MyModel.all_objects  # Includes soft-deleted records
```

## QuerySet Best Practices

```python
# ✅ select_related for FK (single SQL JOIN)
Department.objects.filter(...).select_related("manager", "linked_project")

# ✅ prefetch_related for reverse FK / M2M
Issue.issue_objects.filter(...).prefetch_related("labels", "assignees", "issue_module__module")

# ✅ Prefetch with custom queryset
queryset.prefetch_related(
    Prefetch("issue_reactions", queryset=IssueReaction.objects.select_related("issue", "actor"))
)

# ✅ Annotate computed fields (avoid N+1)
queryset.annotate(
    staff_count=Count("staff_members", filter=Q(staff_members__deleted_at__isnull=True))
)

# ✅ Subquery for cross-model aggregation
queryset.annotate(
    cycle_id=Subquery(CycleIssue.objects.filter(issue=OuterRef("id")).values("cycle_id")[:1])
)

# ✅ ArrayAgg + Coalesce for M2M ID lists
queryset.annotate(
    label_ids=Coalesce(
        Subquery(
            IssueLabel.objects.filter(issue_id=OuterRef("pk"))
            .values("issue_id")
            .annotate(arr=ArrayAgg("label_id", distinct=True))
            .values("arr")
        ),
        Value([], output_field=ArrayField(UUIDField())),
    )
)

# ✅ Use Exists() for boolean annotations
queryset.annotate(
    is_subscribed=Exists(
        IssueSubscriber.objects.filter(issue_id=OuterRef("pk"), subscriber=request.user)
    )
)
```
