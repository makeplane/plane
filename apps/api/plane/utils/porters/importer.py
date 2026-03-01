# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from .formatters import BaseFormatter
from typing import Any, Dict, List
from dataclasses import dataclass, field


@dataclass
class ImportResult:
    """Tracks import success/failures"""

    success_count: int = 0
    error_count: int = 0
    created: Dict[int, Any] = field(default_factory=dict)  # row_index: identifier or metadata dict
    errors: Dict[int, Dict] = field(default_factory=dict)  # row_index: errors
    total_rows: int = 0  # Total rows processed

    @property
    def total(self) -> int:
        return self.success_count + self.error_count

    @property
    def has_errors(self) -> bool:
        return self.error_count > 0

    @property
    def successful_count(self) -> int:
        """Alias for success_count"""
        return self.success_count

    @property
    def failed_count(self) -> int:
        """Alias for error_count"""
        return self.error_count

    @property
    def created_ids(self) -> List[str]:
        """Get list of created identifiers in order"""
        return [self.created[idx] for idx in sorted(self.created.keys())]

    def __str__(self) -> str:
        return f"Success: {self.success_count} | Errors: {self.error_count} | Total: {self.total}"


class DataImporter:
    """
    Import data using DRF serializers.

    Supports two processing modes:
    1. Batch mode (many=True): For serializers that need batch validation (e.g., seat limits)
    2. Individual mode: For simple row-by-row processing with automatic partial imports

    The mode is auto-detected by checking if the serializer has batch validation logic.

    Usage:
        # User import (batch validation for seat limits):
        importer = DataImporter(UserImportSerializer, context={...})
        result = importer.from_string(csv_content, CSVFormatter())

        # Issue import (individual processing):
        importer = DataImporter(IssueImportSerializer, context={...})
        result = importer.from_string(csv_content, CSVFormatter())

        # Dry run validation:
        result = importer.validate(csv_content, CSVFormatter())
    """

    def __init__(self, serializer_class, **serializer_kwargs):
        self.serializer_class = serializer_class
        self.serializer_kwargs = serializer_kwargs
        # Auto-detect processing mode
        self.use_batch_mode = self._requires_batch_processing()

    @staticmethod
    def _get_instance_identifier(instance) -> Any:
        """
        Get human-readable identifier for an instance.

        For dict: returns the dict as-is (e.g., UserImportSerializer metadata)
        For Issue: returns PROJECT-123 format
        For User: returns email
        For others: returns str(instance)
        """
        # Pass through dict results (e.g., from UserImportSerializer)
        if isinstance(instance, dict):
            return instance

        # Check if it's an Issue instance with project and sequence_id
        if hasattr(instance, "project") and hasattr(instance, "sequence_id"):
            project = instance.project
            if hasattr(project, "identifier"):
                return f"{project.identifier}-{instance.sequence_id}"

        # Check if it's a User with email
        if hasattr(instance, "email"):
            return instance.email

        # Fallback to string representation or ID
        if hasattr(instance, "id"):
            return str(instance.id)

        return str(instance)

    def _requires_batch_processing(self) -> bool:
        """
        Check if serializer requires batch processing.

        Returns True if the serializer has a custom ListSerializer with validate() override.
        This indicates batch-level validation (e.g., seat limits).
        """
        if not hasattr(self.serializer_class, "Meta"):
            return False

        meta = self.serializer_class.Meta
        if not hasattr(meta, "list_serializer_class"):
            return False

        list_serializer_class = meta.list_serializer_class

        # Check if validate() is overridden (indicates batch validation)
        from rest_framework import serializers

        base_validate = serializers.ListSerializer.validate
        return list_serializer_class.validate != base_validate

    def _process(self, rows: List[Dict], save: bool = True) -> ImportResult:
        """
        Process rows using batch or individual mode based on serializer requirements.
        """
        if self.use_batch_mode:
            return self._process_batch(rows, save)
        else:
            return self._process_individual(rows, save)

    def _process_batch(self, rows: List[Dict], save: bool = True) -> ImportResult:
        """
        Process all rows using many=True for batch validation.

        Used for serializers that need batch-level validation (e.g., seat limits).
        """
        result = ImportResult()
        result.total_rows = len(rows)

        if not rows:
            return result

        serializer = self.serializer_class(data=rows, many=True, **self.serializer_kwargs)

        if not serializer.is_valid():
            # Handle validation errors
            errors = serializer.errors

            # Check if it's a list-level error (like seat validation)
            if isinstance(errors, dict) and "non_field_errors" in errors:
                # List-level validation error - all rows failed
                result.error_count = len(rows)
                result.errors[0] = {"_list_error": errors["non_field_errors"]}
                return result

            # Per-row validation errors
            if isinstance(errors, list):
                for idx, row_errors in enumerate(errors):
                    if row_errors:
                        result.errors[idx] = dict(row_errors)
                        result.error_count += 1
                    else:
                        result.success_count += 1
            else:
                # Unexpected error format
                result.error_count = len(rows)
                result.errors[0] = {"_validation_error": str(errors)}
                return result

        # Validation passed, now save
        if save:
            try:
                instances = serializer.save()
                instance_list = instances if isinstance(instances, list) else [instances]

                # Map instances to row indices, filtering out None values
                for idx, instance in enumerate(instance_list):
                    if instance is not None:
                        identifier = self._get_instance_identifier(instance)
                        result.created[idx] = identifier

                result.success_count = len(result.created)
                result.error_count = result.total_rows - result.success_count
            except Exception as e:
                result.error_count = len(rows)
                result.errors[0] = {"_save_error": str(e)}
        else:
            result.success_count = len(rows)

        return result

    def _process_individual(self, rows: List[Dict], save: bool = True) -> ImportResult:
        """
        Process rows individually for automatic partial imports.

        Each row is validated and saved independently. Failures don't stop processing.
        """
        result = ImportResult()
        result.total_rows = len(rows)

        if not rows:
            return result

        for idx, row in enumerate(rows):
            serializer = self.serializer_class(data=row, **self.serializer_kwargs)

            # Validate row
            if not serializer.is_valid():
                result.errors[idx] = serializer.errors
                result.error_count += 1
                continue

            # Save if requested
            if save:
                try:
                    instance = serializer.save()
                    identifier = self._get_instance_identifier(instance)
                    result.created[idx] = identifier
                    result.success_count += 1
                except Exception as e:
                    result.errors[idx] = {"_save_error": str(e)}
                    result.error_count += 1
            else:
                # Validation-only mode
                result.success_count += 1

        return result

    def from_string(self, content: str, formatter: BaseFormatter, save: bool = True) -> ImportResult:
        """Import from formatted string"""
        rows = formatter.decode(content)
        return self._process(rows, save=save)

    def from_file(self, filepath: str, formatter: BaseFormatter, save: bool = True) -> ImportResult:
        """Import from file"""
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return self.from_string(content, formatter, save=save)

    def validate(self, content: str, formatter: BaseFormatter) -> ImportResult:
        """Validate without saving (dry run)"""
        return self.from_string(content, formatter, save=False)

    def validate_file(self, filepath: str, formatter: BaseFormatter) -> ImportResult:
        """Validate file without saving"""
        return self.from_file(filepath, formatter, save=False)
