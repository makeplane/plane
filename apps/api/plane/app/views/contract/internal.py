# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Endpoints under /api/internal/ consumed by the Cloudflare Worker running
the contracts pipeline. Authenticated with the shared secret only — no user
session. The Worker never touches Postgres directly; every read/write goes
through these endpoints so Django stays the single owner of the schema.
"""

# Python imports
import uuid
from datetime import date

from dateutil.relativedelta import relativedelta

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions.internal import WorkerServicePermission
from plane.app.serializers import ContractSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Contract,
    ContractChunk,
    ContractProcessingJob,
    ContractQuery,
    FileAsset,
    FileTag,
    FileTagLink,
)
from plane.settings.storage import S3Storage

# Fields (as returned by the AI subtasks, camel/spanish keys from the prompt
# schema) → Contract model columns. Lists are joined to comma-separated text to
# match the crm-new reference schema (String @db.Text columns).
SIMPLE_FIELD_MAP = {
    "tituloContrato": "titulo",
    "resumenGeneral": "resumen_general",
    "nombreGrupo": "nombre_grupo",
    "esPosibleExpandirlo": "es_posible_expandirlo",
    "tiempoExtensionPosible": "tiempo_extension_posible",
    "clausulaRenovacion": "expansion_time_description",
    "estatusContrato": "estatus_contrato",
    "tipoContrato": "tipo_contrato",
    "periodoColeccion": "periodo_coleccion",
    "descripcionPeriodoColeccion": "collection_period_description",
    "duracionPeriodoColeccion": "collection_period_duration",
    "periodoRetencion": "periodo_retencion",
    "descripcionPeriodoRetencion": "retention_period_description",
    "duracionPeriodoRetencion": "retention_period_duration",
}
LIST_FIELD_MAP = {
    "involucrados": "involucrados",
    "testigos": "testigos",
    "artistas": "artistas",
}
DATE_FIELD_MAP = {"fechaInicio": "fecha_inicio", "fechaFin": "fecha_fin"}


def _parse_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def apply_extracted_data(contract, data):
    """Applies an AI extraction payload to the contract's live columns,
    computes fecha_fin_efectiva and auto-tags the file by artist.
    """
    for key, field in SIMPLE_FIELD_MAP.items():
        if key in data and data[key] not in (None, ""):
            setattr(contract, field, data[key])

    for key, field in LIST_FIELD_MAP.items():
        value = data.get(key)
        if isinstance(value, list):
            names = [str(item.get("nombre", item) if isinstance(item, dict) else item).strip() for item in value]
            names = [name for name in names if name]
            setattr(contract, field, ", ".join(names) if names else None)
        elif isinstance(value, str) and value.strip():
            setattr(contract, field, value.strip())

    for key, field in DATE_FIELD_MAP.items():
        parsed = _parse_date(data.get(key))
        if parsed:
            setattr(contract, field, parsed)

    if "esNotariado" in data and data["esNotariado"] is not None:
        contract.es_notariado = bool(data["esNotariado"])

    # Effective end date: fecha_fin + normalized extension months when the
    # contract is expandable (avoids server-side NLP over free text)
    extension_months = data.get("tiempoExtensionMeses")
    if contract.fecha_fin and contract.es_posible_expandirlo == "SI" and isinstance(extension_months, int):
        contract.fecha_fin_efectiva = contract.fecha_fin + relativedelta(months=extension_months)
    elif contract.fecha_fin and contract.fecha_fin_efectiva is None:
        contract.fecha_fin_efectiva = contract.fecha_fin

    contract.save()

    # Auto-tag the file by artist so the library can filter "everything of X".
    # Uses the structured array (never split the joined text — names may
    # contain commas).
    artists = data.get("artistas")
    if isinstance(artists, list) and contract.file_asset_id:
        for item in artists:
            name = str(item.get("nombre", item) if isinstance(item, dict) else item).strip()
            if not name:
                continue
            tag = FileTag.objects.filter(workspace_id=contract.workspace_id, name__iexact=name).first()
            if tag is None:
                tag = FileTag.objects.create(workspace_id=contract.workspace_id, name=name)
            FileTagLink.objects.get_or_create(
                file_asset_id=contract.file_asset_id,
                tag=tag,
                defaults={"workspace_id": contract.workspace_id},
            )


class InternalBaseView(BaseAPIView):
    authentication_classes = []
    permission_classes = [WorkerServicePermission]


class InternalAssetPresignedUrlEndpoint(InternalBaseView):
    """Resolves a presigned GET URL for an asset so the Worker can download it."""

    def get(self, request, asset_id):
        asset = FileAsset.objects.get(id=asset_id)
        storage = S3Storage()
        url = storage.generate_presigned_url(object_name=asset.asset.name)
        return Response(
            {"url": url, "name": (asset.attributes or {}).get("name"), "type": (asset.attributes or {}).get("type")},
            status=status.HTTP_200_OK,
        )


class InternalJobProgressEndpoint(InternalBaseView):
    """Progress/stage/status updates from the Workflow; keeps the contract's
    processing_status in sync so panels can show live state.
    """

    def post(self, request, job_id):
        job = ContractProcessingJob.objects.filter(id=job_id).first()
        if job is None:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        update_fields = []
        if "progress" in data:
            job.progress = max(0, min(100, int(data["progress"])))
            update_fields.append("progress")
        if "current_stage" in data:
            job.current_stage = str(data["current_stage"])[:255]
            update_fields.append("current_stage")
        if "status" in data and data["status"] in ContractProcessingJob.Status.values:
            job.status = data["status"]
            update_fields.append("status")
            if data["status"] == ContractProcessingJob.Status.RUNNING and job.started_at is None:
                job.started_at = timezone.now()
                update_fields.append("started_at")
            if data["status"] in (ContractProcessingJob.Status.COMPLETED, ContractProcessingJob.Status.FAILED):
                job.finished_at = timezone.now()
                update_fields.append("finished_at")
        if "error" in data:
            job.error = data["error"]
            update_fields.append("error")
        job.save(update_fields=update_fields or None)

        # Mirror terminal states onto the contract itself
        if job.contract_id and "status" in data:
            if data["status"] == ContractProcessingJob.Status.COMPLETED:
                Contract.objects.filter(id=job.contract_id).update(
                    processing_status="COMPLETED", processed_at=timezone.now()
                )
            elif data["status"] == ContractProcessingJob.Status.FAILED:
                Contract.objects.filter(id=job.contract_id).update(processing_status="ERROR")
            elif data["status"] == ContractProcessingJob.Status.RUNNING:
                Contract.objects.filter(id=job.contract_id).update(processing_status="PROCESSING")

        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class InternalContractTextEndpoint(InternalBaseView):
    def get(self, request, contract_id):
        contract = Contract.objects.get(id=contract_id)
        return Response(
            {"extracted_text": contract.extracted_text, "has_text": bool(contract.extracted_text)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, contract_id):
        contract = Contract.objects.get(id=contract_id)
        text = request.data.get("extracted_text")
        if not text:
            return Response({"error": "extracted_text is required"}, status=status.HTTP_400_BAD_REQUEST)
        contract.extracted_text = text
        contract.text_extracted_at = timezone.now()
        contract.save(update_fields=["extracted_text", "text_extracted_at"])
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class InternalContractDataEndpoint(InternalBaseView):
    def post(self, request, contract_id):
        contract = Contract.objects.get(id=contract_id)
        data = request.data.get("data") or {}
        mode = request.data.get("mode", "apply")
        model_used = request.data.get("model_used")

        if model_used:
            contract.ai_model_used = model_used

        if mode == "proposed":
            # Re-analysis result parked until the user confirms the overwrite
            contract.proposed_data = data
            contract.save(update_fields=["proposed_data", "ai_model_used"])
        else:
            apply_extracted_data(contract, data)

        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class InternalContractChunksEndpoint(InternalBaseView):
    def get(self, request, contract_id):
        count = ContractChunk.objects.filter(contract_id=contract_id).count()
        return Response({"exists": count > 0, "count": count}, status=status.HTTP_200_OK)

    def post(self, request, contract_id):
        contract = Contract.objects.get(id=contract_id)
        chunks = request.data.get("chunks") or []
        if not isinstance(chunks, list) or not chunks:
            return Response({"error": "chunks must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        # Replace wholesale: chunking is deterministic over the current text
        ContractChunk.objects.filter(contract=contract).delete(soft=False)
        ContractChunk.objects.bulk_create(
            [
                ContractChunk(
                    workspace_id=contract.workspace_id,
                    contract=contract,
                    chunk_index=int(chunk["index"]),
                    content=chunk["content"],
                    token_count=int(chunk.get("token_count", 0)),
                    embedding=chunk["embedding"],
                )
                for chunk in chunks
            ],
            batch_size=100,
        )
        return Response({"status": "ok", "count": len(chunks)}, status=status.HTTP_200_OK)


class InternalContractThumbnailEndpoint(InternalBaseView):
    def post(self, request, contract_id):
        """Returns a presigned POST so the Worker can upload the rendered
        thumbnail directly to storage.
        """
        contract = Contract.objects.get(id=contract_id)
        name = f"contract-thumbnail-{contract.id}.png"
        asset_key = f"{contract.workspace_id}/{uuid.uuid4().hex}-{name}"
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": "image/png", "size": 0},
            asset=asset_key,
            size=0,
            workspace_id=contract.workspace_id,
            entity_type=FileAsset.EntityTypeContext.CONTRACT_THUMBNAIL,
        )
        storage = S3Storage()
        presigned = storage.generate_presigned_post(
            object_name=asset_key, file_type="image/png", file_size=10 * 1024 * 1024
        )
        return Response({"upload_data": presigned, "asset_id": str(asset.id)}, status=status.HTTP_200_OK)

    def patch(self, request, contract_id):
        contract = Contract.objects.get(id=contract_id)
        asset_id = request.data.get("asset_id")
        asset = FileAsset.objects.filter(id=asset_id, workspace_id=contract.workspace_id).first()
        if asset is None:
            return Response({"error": "Asset not found"}, status=status.HTTP_400_BAD_REQUEST)
        asset.is_uploaded = True
        asset.save(update_fields=["is_uploaded"])
        contract.thumbnail_asset = asset
        contract.save(update_fields=["thumbnail_asset"])
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class InternalWorkspaceContractsEndpoint(InternalBaseView):
    """Paginated contract list (with extracted text) for the NL query fan-out."""

    def get(self, request, workspace_id):
        limit = min(int(request.query_params.get("limit", 20)), 50)
        offset = int(request.query_params.get("offset", 0))
        contracts = (
            Contract.objects.filter(workspace_id=workspace_id, extracted_text__isnull=False)
            .exclude(extracted_text="")
            .order_by("created_at")
        )
        total = contracts.count()
        page = contracts[offset : offset + limit]
        return Response(
            {
                "total": total,
                "offset": offset,
                "results": [
                    {
                        "id": str(contract.id),
                        "titulo": contract.titulo,
                        "file_name": (contract.file_asset.attributes or {}).get("name")
                        if contract.file_asset_id
                        else None,
                        "extracted_text": contract.extracted_text,
                    }
                    for contract in page
                ],
            },
            status=status.HTTP_200_OK,
        )


class InternalChunkSearchEndpoint(InternalBaseView):
    """Vector search over the workspace's contract chunks (RAG retrieval for
    the general chat). Ranks by cosine distance and returns the top chunks
    with their source-contract metadata.
    """

    def post(self, request, workspace_id):
        from pgvector.django import CosineDistance

        embedding = request.data.get("embedding")
        if not isinstance(embedding, list) or not embedding:
            return Response({"error": "embedding is required"}, status=status.HTTP_400_BAD_REQUEST)
        limit = min(int(request.data.get("limit", 12)), 40)

        chunks = (
            ContractChunk.objects.filter(workspace_id=workspace_id)
            .annotate(distance=CosineDistance("embedding", embedding))
            .select_related("contract", "contract__file_asset")
            .order_by("distance")[:limit]
        )
        results = []
        for chunk in chunks:
            contract = chunk.contract
            results.append(
                {
                    "content": chunk.content,
                    "chunk_index": chunk.chunk_index,
                    "similarity": round(1.0 - float(chunk.distance), 4),
                    "contract_id": str(contract.id),
                    "title": contract.titulo,
                    "file_name": (contract.file_asset.attributes or {}).get("name")
                    if contract.file_asset_id
                    else None,
                    "asset_id": str(contract.file_asset_id) if contract.file_asset_id else None,
                }
            )
        return Response({"results": results}, status=status.HTTP_200_OK)


class InternalQueryResultEndpoint(InternalBaseView):
    def post(self, request, query_id):
        from plane.bgtasks.contract_task import send_contract_query_email

        query = ContractQuery.objects.filter(id=query_id).first()
        if query is None:
            return Response({"error": "Query not found"}, status=status.HTTP_404_NOT_FOUND)
        query.result = request.data.get("result")
        query.status = (
            ContractProcessingJob.Status.COMPLETED
            if request.data.get("status", "COMPLETED") == "COMPLETED"
            else ContractProcessingJob.Status.FAILED
        )
        query.save(update_fields=["result", "status"])
        if query.result and query.status == ContractProcessingJob.Status.COMPLETED:
            send_contract_query_email.delay(str(query.id))
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
