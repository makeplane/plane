"""
Utilities for migrating legacy filters to rich filters format.

This module contains helper functions for data migrations that convert
filters fields to rich_filters fields using the LegacyToRichFiltersConverter.
"""

import logging
from typing import Any, Dict, Tuple

from .converters import LegacyToRichFiltersConverter


logger = logging.getLogger("plane.api.filters.migration")


def migrate_single_model_filters(
    model_class, model_name: str, converter: LegacyToRichFiltersConverter
) -> Tuple[int, int]:
    """
    Migrate filters to rich_filters for a single model.

    Args:
        model_class: Django model class
        model_name: Human-readable name for logging
        converter: Instance of LegacyToRichFiltersConverter

    Returns:
        Tuple of (updated_count, error_count)
    """
    # Find records that need migration - have filters but empty rich_filters
    records_to_migrate = model_class.objects.exclude(filters={}).filter(rich_filters={})

    if records_to_migrate.count() == 0:
        logger.info(f"No {model_name} records need migration")
        return 0, 0

    logger.info(f"Found {records_to_migrate.count()} {model_name} records to migrate")

    updated_records = []
    conversion_errors = 0

    for record in records_to_migrate:
        try:
            if record.filters:  # Double check that filters is not empty
                rich_filters = converter.convert(record.filters, strict=False)
                record.rich_filters = rich_filters
                updated_records.append(record)

        except Exception as e:
            logger.warning(f"Failed to convert filters for {model_name} ID {record.id}: {str(e)}")
            conversion_errors += 1
            continue

    # Bulk update all successfully converted records
    if updated_records:
        model_class.objects.bulk_update(updated_records, ["rich_filters"], batch_size=1000)
        logger.info(f"Successfully updated {len(updated_records)} {model_name} records")

    return len(updated_records), conversion_errors


def migrate_models_filters_to_rich_filters(
    models_to_migrate: Dict[str, Any],
    converter: LegacyToRichFiltersConverter,
) -> Dict[str, Tuple[int, int]]:
    """
    Migrate legacy filters to rich_filters format for provided models.

    Args:
        models_to_migrate: Dict mapping model names to model classes

    Returns:
        Dictionary mapping model names to (updated_count, error_count) tuples
    """
    # Initialize the converter with default settings

    logger.info("Starting filters to rich_filters migration for all models")

    results = {}
    total_updated = 0
    total_errors = 0

    for model_name, model_class in models_to_migrate.items():
        try:
            updated_count, error_count = migrate_single_model_filters(model_class, model_name, converter)

            results[model_name] = (updated_count, error_count)
            total_updated += updated_count
            total_errors += error_count

        except Exception as e:
            logger.error(f"Failed to migrate {model_name}: {str(e)}")
            results[model_name] = (0, 1)
            total_errors += 1
            continue

    # Log final summary
    logger.info(f"Migration completed for all models. Total updated: {total_updated}, Total errors: {total_errors}")

    return results


def clear_models_rich_filters(models_to_clear: Dict[str, Any]) -> Dict[str, int]:
    """
    Clear rich_filters field for provided models (for reverse migration).

    Args:
        models_to_clear: Dictionary mapping model names to model classes

    Returns:
        Dictionary mapping model names to count of cleared records
    """
    logger.info("Starting reverse migration - clearing rich_filters for all models")

    results = {}
    total_cleared = 0

    for model_name, model_class in models_to_clear.items():
        try:
            # Clear rich_filters for all records that have them
            updated_count = model_class.objects.exclude(rich_filters={}).update(rich_filters={})
            results[model_name] = updated_count
            total_cleared += updated_count
            logger.info(f"Cleared rich_filters for {updated_count} {model_name} records")

        except Exception as e:
            logger.error(f"Failed to clear rich_filters for {model_name}: {str(e)}")
            results[model_name] = 0
            continue

    logger.info(f"Reverse migration completed. Total cleared: {total_cleared}")
    return results
