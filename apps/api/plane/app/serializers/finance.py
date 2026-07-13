# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Budget, Expense, ExpenseCategory

from .base import BaseSerializer


class ExpenseCategorySerializer(BaseSerializer):
    expense_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ExpenseCategory
        fields = [
            "id",
            "name",
            "description",
            "color",
            "workspace_id",
            "expense_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Category name cannot be empty")
        return value


class BudgetSerializer(BaseSerializer):
    class Meta:
        model = Budget
        fields = [
            "id",
            "category",
            "project",
            "period_start",
            "period_end",
            "amount",
            "currency",
            "notes",
            "workspace_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "created_at", "updated_at"]

    def validate(self, data):
        # The database enforces this too, but a 400 with a message beats an
        # IntegrityError surfacing as a 500.
        start = data.get("period_start", getattr(self.instance, "period_start", None))
        end = data.get("period_end", getattr(self.instance, "period_end", None))
        if start and end and end < start:
            raise serializers.ValidationError({"period_end": "The period cannot end before it starts"})
        return data

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("The budget cannot be negative")
        return value


class ExpenseSerializer(BaseSerializer):
    # Denormalized for the table so it doesn't need a second round-trip
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    documents = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "category_name",
            "project",
            "documents",
            "amount",
            "currency",
            "expense_date",
            "vendor",
            "description",
            "reference",
            "status",
            "paid_at",
            "workspace_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace_id", "created_at", "updated_at"]

    def get_documents(self, obj):
        """Enough for the row's chips and the preview modal (which needs the
        content type to pick a viewer) without a second request.
        """
        return [
            {
                "id": str(document.id),
                "asset_id": str(document.asset_id),
                "name": (document.asset.attributes or {}).get("name"),
                "type": (document.asset.attributes or {}).get("type"),
                "size": (document.asset.attributes or {}).get("size"),
            }
            for document in obj.documents.all()
            if document.asset_id
        ]

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("The amount cannot be negative")
        return value
