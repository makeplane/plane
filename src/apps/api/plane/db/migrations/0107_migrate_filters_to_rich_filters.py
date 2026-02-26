from django.db import migrations

from plane.utils.filters import LegacyToRichFiltersConverter
from plane.utils.filters.filter_migrations import (
    migrate_models_filters_to_rich_filters,
    clear_models_rich_filters,
)


# Define all models that need migration in one place
MODEL_NAMES = [
    "IssueView",
    "WorkspaceUserProperties",
    "ModuleUserProperties", 
    "IssueUserProperty",
    "CycleUserProperties",
]


def migrate_filters_to_rich_filters(apps, schema_editor):
    """
    Migrate legacy filters to rich_filters format for all models that have both fields.
    """
    # Get the model classes from model names
    models_to_migrate = {}
    
    for model_name in MODEL_NAMES:
        try:
            model_class = apps.get_model("db", model_name)
            models_to_migrate[model_name] = model_class
        except Exception as e:
            # Log error but continue with other models
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to get model {model_name}: {str(e)}")
    
    converter = LegacyToRichFiltersConverter()
    # Migrate all models
    migrate_models_filters_to_rich_filters(models_to_migrate, converter)


def reverse_migrate_rich_filters_to_filters(apps, schema_editor):
    """
    Reverse migration to clear rich_filters field for all models.
    """
    # Get the model classes from model names
    models_to_clear = {}
    
    for model_name in MODEL_NAMES:
        try:
            model_class = apps.get_model("db", model_name)
            models_to_clear[model_name] = model_class
        except Exception as e:
            # Log error but continue with other models
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to get model {model_name}: {str(e)}")
    
    # Clear rich_filters for all models
    clear_models_rich_filters(models_to_clear)


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0106_auto_20250912_0845'),
    ]

    operations = [
        migrations.RunPython(
            migrate_filters_to_rich_filters,
            reverse_code=reverse_migrate_rich_filters_to_filters,
        ),
    ]