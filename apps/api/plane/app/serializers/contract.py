# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Contract, ContractChat, ContractChatMessage, ContractProcessingJob, ContractQuery

from .base import BaseSerializer

# AI-extracted fields the user can edit by hand (mirrors the crm-new schema)
CONTRACT_EDITABLE_FIELDS = [
    "titulo",
    "resumen_general",
    "nombre_grupo",
    "artistas",
    "testigos",
    "involucrados",
    "es_notariado",
    "fecha_inicio",
    "fecha_fin",
    "es_posible_expandirlo",
    "tiempo_extension_posible",
    "expansion_time_description",
    "fecha_fin_efectiva",
    "estatus_contrato",
    "tipo_contrato",
    "periodo_coleccion",
    "collection_period_description",
    "collection_period_duration",
    "periodo_retencion",
    "retention_period_description",
    "retention_period_duration",
]


class ContractSerializer(BaseSerializer):
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "id",
            "workspace_id",
            "file_asset_id",
            "thumbnail_asset_id",
            "file_name",
            "processing_status",
            "proposed_data",
            "ai_model_used",
            "processed_at",
            "text_extracted_at",
            *CONTRACT_EDITABLE_FIELDS,
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_file_name(self, obj):
        return (obj.file_asset.attributes or {}).get("name") if obj.file_asset_id else None


class ContractUpdateSerializer(BaseSerializer):
    class Meta:
        model = Contract
        fields = CONTRACT_EDITABLE_FIELDS


class ContractProcessingJobSerializer(BaseSerializer):
    class Meta:
        model = ContractProcessingJob
        fields = [
            "id",
            "workspace_id",
            "contract_id",
            "initiated_by_id",
            "task_type",
            "status",
            "progress",
            "current_stage",
            "workflow_instance_id",
            "error",
            "metadata",
            "started_at",
            "finished_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ContractChatSerializer(BaseSerializer):
    class Meta:
        model = ContractChat
        fields = [
            "id",
            "workspace_id",
            "user_id",
            "title",
            "mode",
            "contract_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ContractChatMessageSerializer(BaseSerializer):
    class Meta:
        model = ContractChatMessage
        fields = ["id", "chat_id", "role", "content", "sources", "created_at"]
        read_only_fields = fields


class ContractQuerySerializer(BaseSerializer):
    class Meta:
        model = ContractQuery
        fields = [
            "id",
            "workspace_id",
            "user_id",
            "query",
            "status",
            "result",
            "emailed_at",
            "job_id",
            "created_at",
        ]
        read_only_fields = fields
