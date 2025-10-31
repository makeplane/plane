# Generated manually for converting use_case from TextField to JSONField

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0107_migrate_filters_to_rich_filters"),
    ]

    operations = [
        # Convert TextField to JSONField with data transformation in a single atomic operation
        # Uses PostgreSQL's json_build_array to wrap existing text strings in JSON arrays
        migrations.RunSQL(
            # Forward: Convert TextField → JSONField, wrapping strings in arrays
            sql="""
                ALTER TABLE profiles
                ALTER COLUMN use_case TYPE jsonb
                USING CASE
                    WHEN use_case IS NULL OR use_case = '' THEN '[]'::jsonb
                    ELSE json_build_array(use_case)::jsonb
                END;
            """,
            # Reverse: Convert JSONField → TextField, extracting first array element
            reverse_sql="""
                ALTER TABLE profiles
                ALTER COLUMN use_case TYPE text
                USING CASE
                    WHEN use_case IS NULL THEN NULL
                    WHEN jsonb_array_length(use_case) > 0 THEN use_case->>0
                    ELSE NULL
                END;
            """,
        ),
    ]
