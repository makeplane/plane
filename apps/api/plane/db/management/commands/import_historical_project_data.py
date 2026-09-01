# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): Phase 3 of the custom
# fields roadmap. Phase 1/2 built the field engine and the standard 23 fields
# (columns A-W of the source contract/delivery tracking spreadsheet, see
# apps/api/plane/db/default_data/project_custom_fields.py); this backfills real
# historical rows into Projects carrying those fields. Columns beyond W (the
# per-month financial matrix etc.) are explicitly out of scope for this phase --
# see that roadmap's "Not building" section.
#
# Usage:
#   python manage.py import_historical_project_data <xlsx_path> \
#       --workspace <workspace-slug> --created-by <user-email> [--dry-run]
#       [--start-row 7] [--header-row 4] [--sheet Sheet1]
#
# Idempotent: a row whose "合同号&项目号" value already exists (as an
# is_unique_key custom field value in this workspace, matching how the live API
# enforces uniqueness -- see ProjectCustomFieldValueSerializer.validate()) is
# skipped rather than re-imported, so re-running after fixing upstream data or
# extending the sheet is safe. --dry-run runs every validation and DB read the
# real import would, then rolls back all writes at the end.

# Python imports
import os
import re

# Third-party imports
import openpyxl
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

# Module imports
from plane.app.permissions import ROLE
from plane.app.serializers import ProjectSerializer
from plane.db.default_data.project_custom_fields import DEFAULT_PROJECT_CUSTOM_FIELDS, seed_default_custom_fields
from plane.db.models import (
    DEFAULT_STATES,
    Project,
    ProjectCustomField,
    ProjectCustomFieldValue,
    ProjectMember,
    ProjectUserProperty,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.utils.historical_project_import import is_row_blank, parse_row, sanitize_project_text, validate_headers

# The first entry is always "合同号&项目号": the one field DEFAULT_PROJECT_CUSTOM_FIELDS
# marks is_unique_key=True (see that file's module docstring).
UNIQUE_KEY_FIELD_NAME = DEFAULT_PROJECT_CUSTOM_FIELDS[0]["name"]
PROJECT_NAME_CANDIDATE_FIELDS = ("客户项目名称", "公司项目名称")


class Command(BaseCommand):
    help = (
        "Import historical project rows (columns A-W) from the source contract/delivery "
        "tracking spreadsheet: one Project per row, populated into the 23 custom fields "
        "seed_default_custom_fields already builds for every project."
    )

    def add_arguments(self, parser):
        parser.add_argument("xlsx_path", type=str, help="Path to the source .xlsx file")
        parser.add_argument("--workspace", required=True, dest="workspace_slug", help="Target workspace slug")
        parser.add_argument(
            "--created-by",
            required=True,
            dest="created_by_email",
            help="Email of the (already-a-workspace-member) user to attribute imported projects to",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run every validation and DB read, then roll back all writes instead of committing",
        )
        parser.add_argument("--start-row", type=int, default=7, help="First data row (default 7)")
        parser.add_argument("--header-row", type=int, default=4, help="Row holding the A-W field names (default 4)")
        parser.add_argument("--sheet", type=str, default=None, help="Sheet name (default: the workbook's first sheet)")

    def handle(self, *args, **options):
        xlsx_path = options["xlsx_path"]
        if not os.path.isfile(xlsx_path):
            raise CommandError(f"File not found: {xlsx_path}")

        try:
            workspace = Workspace.objects.get(slug=options["workspace_slug"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace not found: {options['workspace_slug']}") from exc

        try:
            # User.save() lowercases email before storing (see plane/db/models/user.py),
            # so match case-insensitively here too; a case-sensitive lookup would fail
            # to find a real account whenever the operator types it with any capitals.
            created_by = User.objects.get(email=options["created_by_email"].strip().lower())
        except User.DoesNotExist as exc:
            raise CommandError(f"User not found: {options['created_by_email']}") from exc

        if created_by.is_bot or not created_by.is_active:
            raise CommandError(
                f"{options['created_by_email']} is a bot account or globally deactivated; "
                "refusing to attribute imported projects to it."
            )

        if not WorkspaceMember.objects.filter(workspace=workspace, member=created_by, is_active=True).exists():
            raise CommandError(
                f"{options['created_by_email']} is not an active member of workspace "
                f"{workspace.slug}; refusing to attribute imported projects to a non-member."
            )

        workbook = openpyxl.load_workbook(xlsx_path, data_only=True)
        worksheet = workbook[options["sheet"]] if options["sheet"] else workbook.worksheets[0]

        mismatches = validate_headers(worksheet, options["header_row"], DEFAULT_PROJECT_CUSTOM_FIELDS)
        if mismatches:
            raise CommandError(
                "Header row does not match the 23 seeded custom fields (A-W). "
                "Fix the source file or pass --header-row, then re-run:\n" + "\n".join(mismatches)
            )

        dry_run = options["dry_run"]
        stats = {"created": 0, "skipped_blank": 0, "skipped_no_key": 0, "skipped_duplicate": 0, "skipped_error": 0}
        field_warning_count = 0
        seen_keys_this_run = set()

        # Each row gets its OWN top-level transaction (not one big transaction for
        # the whole run). Two reasons:
        # 1. A real historical file can be hundreds of rows; if the process were
        #    killed partway through one shared transaction, nothing commits and
        #    every already-processed row would be lost, not just the interrupted
        #    one. Per-row commits mean a crash only ever costs the row in flight --
        #    a re-run picks up where it left off via the duplicate-key skip below.
        # 2. The advisory lock acquired below is transaction-scoped in Postgres
        #    (released at COMMIT/ROLLBACK, not at a savepoint boundary). Nesting it
        #    inside one giant shared transaction would hold every row's lock for
        #    the entire run, which could block a live user's concurrent edit to the
        #    same unique-key value for minutes. Scoping it to each row's own
        #    transaction releases it as soon as that row is done.
        for row_idx in range(options["start_row"], worksheet.max_row + 1):
            raw_values, coerced, row_warnings = parse_row(worksheet, row_idx, DEFAULT_PROJECT_CUSTOM_FIELDS)

            if is_row_blank(raw_values):
                stats["skipped_blank"] += 1
                continue

            unique_key = coerced.get(UNIQUE_KEY_FIELD_NAME)
            if not unique_key:
                stats["skipped_no_key"] += 1
                self.stderr.write(self.style.WARNING(f"Row {row_idx}: skipped, missing {UNIQUE_KEY_FIELD_NAME}"))
                continue

            try:
                with transaction.atomic():
                    # Mirrors ProjectCustomFieldValueViewSet.partial_update()'s lock:
                    # the duplicate check below is a separate SELECT from this row's
                    # eventual INSERT, and no DB constraint can enforce workspace-wide
                    # uniqueness directly (the value lives on a per-project row). A
                    # Postgres advisory lock keyed on (workspace, value) serializes
                    # only writers racing for the *same* value -- other rows in this
                    # same run, another concurrent run of this command, and any live
                    # API write through that endpoint -- against each other.
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "SELECT pg_advisory_xact_lock(hashtext(%s))", [f"{workspace.id}:{unique_key}"]
                        )

                    is_duplicate = unique_key in seen_keys_this_run or ProjectCustomFieldValue.objects.filter(
                        workspace=workspace,
                        custom_field__is_unique_key=True,
                        custom_field__deleted_at__isnull=True,
                        value_text=unique_key,
                        deleted_at__isnull=True,
                    ).exists()
                    if is_duplicate:
                        stats["skipped_duplicate"] += 1
                        self.stderr.write(self.style.WARNING(f"Row {row_idx}: skipped, duplicate {unique_key!r}"))
                        continue

                    project = self._create_project_for_row(workspace, created_by, coerced, row_idx)
                    self._write_field_values(workspace, project, created_by, coerced)

                    if dry_run:
                        transaction.set_rollback(True)
            except Exception as exc:  # noqa: BLE001 -- one bad row must not abort the whole import
                stats["skipped_error"] += 1
                self.stderr.write(self.style.ERROR(f"Row {row_idx} ({unique_key!r}): failed, {exc}"))
                continue

            if unique_key in seen_keys_this_run:
                # The "continue" for the duplicate branch above lands here too (it
                # exits the `with` block cleanly, not via exception), so re-check
                # before counting this as a fresh create.
                continue

            seen_keys_this_run.add(unique_key)
            stats["created"] += 1
            field_warning_count += len(row_warnings)
            for warning in row_warnings:
                self.stderr.write(self.style.WARNING(f"Row {row_idx} ({unique_key!r}): {warning}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"{'[DRY RUN] ' if dry_run else ''}Created {stats['created']} project(s). "
                f"Skipped: {stats['skipped_blank']} blank, {stats['skipped_no_key']} missing unique key, "
                f"{stats['skipped_duplicate']} duplicate, {stats['skipped_error']} error. "
                f"{field_warning_count} field-level warning(s) (see above)."
            )
        )

    def _create_project_for_row(self, workspace, created_by, coerced, row_idx):
        raw_name = next(
            (coerced.get(field_name) for field_name in PROJECT_NAME_CANDIDATE_FIELDS if coerced.get(field_name)),
            None,
        )
        # "-" is forbidden in Project.name (Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN),
        # so the fallback uses "_" as a separator, matching the existing convention in
        # apps/api/plane/bgtasks/dummy_data_task.py's create_project().
        fallback_key = sanitize_project_text(coerced[UNIQUE_KEY_FIELD_NAME], max_length=40) or "unnamed"
        name = sanitize_project_text(raw_name) or f"导入项目_{fallback_key}"
        name = self._unique_project_name(workspace, name)
        identifier = self._generate_identifier(workspace, name, row_idx)

        serializer = ProjectSerializer(data={"name": name, "identifier": identifier}, context={"workspace_id": workspace.id})
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        # ProjectSerializer.create() -> Project.objects.create() -> Model.save() reads
        # created_by from crum's request-thread-local, which is empty in a management
        # command; .update() bypasses save() entirely so it always lands regardless.
        Project.objects.filter(pk=project.pk).update(created_by=created_by)

        member = ProjectMember(project=project, workspace=workspace, member=created_by, role=ROLE.ADMIN.value)
        member.save()
        ProjectMember.objects.filter(pk=member.pk).update(created_by=created_by)
        # ProjectMember.save() itself creates a ProjectUserProperty row as a side
        # effect (see that model's save() override); same crum-less created_by gap
        # applies there too, so fix it up the same way.
        ProjectUserProperty.objects.filter(project=project, user=created_by).update(created_by=created_by)

        State.objects.bulk_create(
            [
                State(
                    name=state["name"],
                    color=state["color"],
                    project=project,
                    sequence=state["sequence"],
                    workspace=workspace,
                    group=state["group"],
                    default=state.get("default", False),
                    created_by=created_by,
                )
                for state in DEFAULT_STATES
            ]
        )

        seed_default_custom_fields(project, created_by=created_by)
        return project

    def _write_field_values(self, workspace, project, created_by, coerced):
        fields_by_name = {
            field.name: field for field in ProjectCustomField.objects.filter(project=project).prefetch_related("options")
        }
        value_rows = []
        for spec in DEFAULT_PROJECT_CUSTOM_FIELDS:
            value = coerced.get(spec["name"])
            if value is None:
                continue
            field = fields_by_name[spec["name"]]
            kwargs = {"project": project, "custom_field": field, "workspace_id": workspace.id, "created_by": created_by}
            if spec["field_type"] == "number":
                kwargs["value_decimal"] = value
            elif spec["field_type"] == "text":
                kwargs["value_text"] = value
            elif spec["field_type"] == "date":
                kwargs["value_date"] = value
            elif spec["field_type"] == "dropdown":
                option = next((opt for opt in field.options.all() if opt.name == value), None)
                if option is None:
                    # parse_row already validated the value against spec["options"], so
                    # this only fires if seeding somehow diverged from that list.
                    continue
                kwargs["value_option"] = option
            else:
                continue
            value_rows.append(ProjectCustomFieldValue(**kwargs))

        if value_rows:
            ProjectCustomFieldValue.objects.bulk_create(value_rows)

    def _unique_project_name(self, workspace, base_name):
        # "-" is forbidden in Project.name, so "_" separates the disambiguating suffix.
        # base_name can be up to 255 chars (sanitize_project_text's default
        # max_length): truncate IT, not just the final string, to leave room for the
        # suffix -- f"{base_name}_{suffix}"[:255] alone would silently truncate the
        # suffix away whenever base_name is already >= 255 chars, producing the same
        # colliding string on every iteration and looping forever.
        name = base_name
        suffix = 2
        while Project.objects.filter(workspace=workspace, name=name).exists():
            suffix_text = f"_{suffix}"
            name = f"{base_name[: 255 - len(suffix_text)]}{suffix_text}"
            suffix += 1
        return name

    def _generate_identifier(self, workspace, name, row_idx):
        letters = "".join(ch for ch in name.upper() if ch.isalnum() and ch.isascii())
        base = letters[:8] or "PRJ"
        # Start from row_idx instead of 1: this dataset is Chinese-language, so many
        # rows fall back to the same short base ("PRJ", or one leftover Latin letter
        # from a name like "内部项目名A"). Starting every row's scan at suffix=1 would
        # make row N re-check ~N already-taken candidates before finding a free one
        # (O(rows^2) queries total). row_idx is unique per row and increases through
        # the file, so f"{base}{row_idx}" is already very likely free on the first try.
        suffix = row_idx
        while True:
            candidate = f"{base}{suffix}"[:12]
            if not re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, candidate) and not Project.objects.filter(
                workspace=workspace, identifier=candidate
            ).exists():
                return candidate
            suffix += 1
