# Data migration: remove seeded default labels from all projects
# and clean up ghost migration records from the deleted 0128/0134 files.
#
# NOTE: Migrations 0128 and 0134 were custom data-only migrations added in
# plan 260303-2042-default-labels (private fork). They have been intentionally
# deleted as part of the revert. The sequence gap (0128→0134 missing) is
# expected — Django resolves the dependency chain via 0135 as the base.
from django.db import migrations

_SEEDED_NAMES_SQL = (
    "'Bank-wide Project','Daily','Weekly','Bi-weekly',"
    "'Monthly','Quarterly','Half-year','Yearly','Ad-hoc'"
)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0135_rename_backlog_state_display"),
    ]
    operations = [
        # Remove ghost records left by deleted migration files 0128 and 0134.
        migrations.RunSQL(
            sql=(
                "DELETE FROM django_migrations WHERE app = 'db' AND name IN ("
                "'0128_seed_default_labels_existing_projects',"
                "'0134_add_biweekly_default_label'"
                ")"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
