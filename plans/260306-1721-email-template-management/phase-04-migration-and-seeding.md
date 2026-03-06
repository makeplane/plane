# Phase 4: Migration & Seeding

## Context Links

- [Phase 1: Backend Model & API](./phase-01-backend-model-and-api.md)
- [Phase 2: Template Registry](./phase-02-template-registry.md)
- [Existing templates](../../apps/api/templates/emails/)

## Overview

- **Priority**: P3 (nice-to-have, system works without seeding)
- **Status**: pending
- **Description**: Management command to optionally seed DB from existing file templates. Migration strategy doc.

## Key Insights

- System works without seeding — file fallback is default behavior
- Seeding only needed if admin wants to start editing from current template content
- List endpoint should show all registered templates regardless of DB existence

## Requirements

### Functional

- Management command `seed_email_templates` populates DB from file templates
- Command is idempotent (skip existing, don't overwrite)
- Optional `--force` flag to overwrite existing DB records
- Dry-run mode to preview what would be seeded

### Non-functional

- Command runs in <5 seconds (12 templates, small files)
- Atomic transaction (all-or-nothing)

## Architecture

### Management Command

```python
# plane/license/management/commands/seed_email_templates.py
class Command(BaseCommand):
    help = "Seed EmailTemplate records from file templates"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Overwrite existing")
        parser.add_argument("--dry-run", action="store_true", help="Preview only")

    def handle(self, *args, **options):
        for slug, meta in TEMPLATE_REGISTRY.items():
            # Updated: Validation Session 3 - raw file read preserves {{ }} placeholders
            from django.template.loader import get_template
            template = get_template(meta["file_path"])
            html = open(template.origin.name).read()
            if not options["force"]:
                if EmailTemplate.objects.filter(slug=slug).exists():
                    self.stdout.write(f"SKIP {slug} (exists)")
                    continue
            if not options["dry_run"]:
                EmailTemplate.objects.update_or_create(
                    slug=slug,
                    defaults={"html_content": html, "subject": meta.get("default_subject", "")}
                )
            self.stdout.write(f"{'DRY ' if options['dry_run'] else ''}SEED {slug}")
```

## Related Code Files

### Create

- `apps/api/plane/license/management/__init__.py`
- `apps/api/plane/license/management/commands/__init__.py`
- `apps/api/plane/license/management/commands/seed_email_templates.py`

## Implementation Steps

1. Create management command directory structure
   - `plane/license/management/__init__.py`
   - `plane/license/management/commands/__init__.py`

2. Create `seed_email_templates.py` command
   - Import TEMPLATE_REGISTRY from Phase 2
   - Loop through registry, read file templates via `open()` raw file read (preserves {{ }} placeholders)
   - Use `update_or_create` for upsert behavior
   - Wrap in `transaction.atomic()`

3. Add `--force` and `--dry-run` flags

4. Test command:
   - `python manage.py seed_email_templates --dry-run`
   - `python manage.py seed_email_templates`
   - `python manage.py seed_email_templates --force`

## Todo List

- [ ] Create management command directory structure
- [ ] Implement seed_email_templates command
- [ ] Add --force flag
- [ ] Add --dry-run flag
- [ ] Test idempotency

## Success Criteria

- Command seeds all 12 templates from file to DB
- Running twice without --force skips existing records
- --force overwrites existing records
- --dry-run shows actions without modifying DB

## Risk Assessment

- **File reading**: Use raw file read (open()) instead of render_to_string to preserve {{ }} placeholders
<!-- Updated: Validation Session 1 - raw file read confirmed -->

## Security Considerations

- Command requires shell access (admin-only by nature)
- No user input involved

## Next Steps

- Document in deployment guide: optional `seed_email_templates` step
- Consider auto-seeding in Docker entrypoint (future, not MVP)
