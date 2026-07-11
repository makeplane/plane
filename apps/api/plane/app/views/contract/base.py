# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    ContractProcessingJobSerializer,
    ContractQuerySerializer,
    ContractSerializer,
    ContractUpdateSerializer,
)
from plane.bgtasks.contract_task import dispatch_contract_pipeline, dispatch_contract_query
from plane.db.models import Contract, ContractProcessingJob, ContractQuery, Workspace

from ..file_library.base import FileLibraryBaseView

RETRY_OPTION_KEYS = ["extract_text", "generate_embeddings", "ai_analysis", "extract_thumbnail"]


def ensure_contract_for_asset(asset, user=None):
    """Creates the Contract row and kicks off the extraction pipeline the
    first time a PDF is linked to the protected "Contratos" category.
    Idempotent: re-linking an already-tracked file does nothing.
    """
    if (asset.attributes or {}).get("type") != "application/pdf":
        return None
    contract = Contract.objects.filter(file_asset=asset).first()
    if contract is not None:
        return contract
    contract = Contract.objects.create(workspace_id=asset.workspace_id, file_asset=asset)
    create_and_dispatch_job(
        workspace=contract.workspace,
        contract=contract,
        task_type=ContractProcessingJob.TaskType.EXTRACT_FULL,
        user=user,
    )
    return contract


def create_and_dispatch_job(workspace, contract, task_type, user=None, metadata=None):
    """Creates a processing job and hands it to the Worker via celery."""
    job = ContractProcessingJob.objects.create(
        workspace=workspace,
        contract=contract,
        initiated_by=user,
        task_type=task_type,
        status=ContractProcessingJob.Status.QUEUED,
        current_stage="Waiting in queue",
        metadata=metadata or {},
    )
    if contract is not None:
        contract.processing_status = "PROCESSING"
        contract.save(update_fields=["processing_status"])
    dispatch_contract_pipeline.delay(str(job.id))
    return job


class ContractsEndpoint(FileLibraryBaseView):
    serializer_class = ContractSerializer
    model = Contract

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        contracts = Contract.objects.filter(workspace__slug=slug).select_related("file_asset")

        # Filters over AI-extracted data
        asset_id = request.query_params.get("asset_id")
        if asset_id:
            contracts = contracts.filter(file_asset_id=asset_id)
        search = request.query_params.get("search")
        if search:
            contracts = contracts.filter(
                Q(titulo__icontains=search)
                | Q(resumen_general__icontains=search)
                | Q(file_asset__attributes__name__icontains=search)
            )
        person = request.query_params.get("person")
        if person:
            contracts = contracts.filter(Q(involucrados__icontains=person) | Q(testigos__icontains=person))
        artist = request.query_params.get("artist")
        if artist:
            contracts = contracts.filter(artistas__icontains=artist)
        year = request.query_params.get("year")
        if year:
            contracts = contracts.filter(Q(fecha_inicio__year=year) | Q(fecha_fin__year=year))
        estatus = request.query_params.getlist("estatus")
        if estatus:
            contracts = contracts.filter(estatus_contrato__in=estatus)
        tipo = request.query_params.getlist("tipo")
        if tipo:
            contracts = contracts.filter(tipo_contrato__in=tipo)
        processing_status = request.query_params.getlist("processing_status")
        if processing_status:
            contracts = contracts.filter(processing_status__in=processing_status)
        fin_after = request.query_params.get("fecha_fin_efectiva_after")
        if fin_after:
            contracts = contracts.filter(fecha_fin_efectiva__gte=fin_after)
        fin_before = request.query_params.get("fecha_fin_efectiva_before")
        if fin_before:
            contracts = contracts.filter(fecha_fin_efectiva__lte=fin_before)

        serializer = ContractSerializer(contracts.order_by("-created_at"), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContractDetailEndpoint(FileLibraryBaseView):
    serializer_class = ContractSerializer
    model = Contract

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, contract_id):
        contract = Contract.objects.select_related("file_asset").get(id=contract_id, workspace__slug=slug)
        return Response(ContractSerializer(contract).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, contract_id):
        contract = Contract.objects.get(id=contract_id, workspace__slug=slug)
        serializer = ContractUpdateSerializer(contract, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ContractSerializer(contract).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContractRetryEndpoint(FileLibraryBaseView):
    model = ContractProcessingJob

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, contract_id):
        contract = Contract.objects.get(id=contract_id, workspace__slug=slug)
        retry_options = {key: bool(request.data.get(key)) for key in RETRY_OPTION_KEYS}
        if not any(retry_options.values()):
            # No selection = full retry
            retry_options = {key: True for key in RETRY_OPTION_KEYS}
        job = create_and_dispatch_job(
            workspace=contract.workspace,
            contract=contract,
            task_type=ContractProcessingJob.TaskType.RETRY_PARTIAL,
            user=request.user,
            metadata={"retry_options": retry_options},
        )
        return Response(ContractProcessingJobSerializer(job).data, status=status.HTTP_201_CREATED)


class ContractReanalyzeEndpoint(FileLibraryBaseView):
    model = ContractProcessingJob

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, contract_id):
        contract = Contract.objects.get(id=contract_id, workspace__slug=slug)
        if not contract.extracted_text:
            return Response(
                {"error": "The contract has no extracted text yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        job = create_and_dispatch_job(
            workspace=contract.workspace,
            contract=contract,
            task_type=ContractProcessingJob.TaskType.REANALYZE,
            user=request.user,
        )
        return Response(ContractProcessingJobSerializer(job).data, status=status.HTTP_201_CREATED)


class ContractReanalyzeConfirmEndpoint(FileLibraryBaseView):
    model = Contract

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, contract_id):
        from .internal import apply_extracted_data

        contract = Contract.objects.get(id=contract_id, workspace__slug=slug)
        if contract.proposed_data is None:
            return Response({"error": "There is no proposed data to confirm"}, status=status.HTTP_400_BAD_REQUEST)

        if request.data.get("accept"):
            apply_extracted_data(contract, contract.proposed_data)
        contract.proposed_data = None
        contract.save(update_fields=["proposed_data"])
        return Response(ContractSerializer(contract).data, status=status.HTTP_200_OK)


class ContractsBulkEndpoint(FileLibraryBaseView):
    """Bulk actions over contracts: retry (full) or re-analyze many at once."""

    model = ContractProcessingJob

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        action = request.data.get("action")
        contract_ids = request.data.get("contract_ids") or []
        if action not in ("retry", "reanalyze") or not isinstance(contract_ids, list) or not contract_ids:
            return Response(
                {"error": "action (retry|reanalyze) and contract_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optional per-stage selection (same contract as single retry):
        # empty/absent selection = full retry
        raw_options = request.data.get("retry_options") or {}
        retry_options = {key: bool(raw_options.get(key)) for key in RETRY_OPTION_KEYS}
        if not any(retry_options.values()):
            retry_options = {key: True for key in RETRY_OPTION_KEYS}

        contracts = Contract.objects.filter(id__in=contract_ids, workspace__slug=slug)
        dispatched, skipped = [], []
        for contract in contracts:
            # Skip contracts that already have an active run
            if contract.jobs.filter(
                status__in=[ContractProcessingJob.Status.QUEUED, ContractProcessingJob.Status.RUNNING]
            ).exists():
                skipped.append(str(contract.id))
                continue
            if action == "reanalyze" and not contract.extracted_text:
                skipped.append(str(contract.id))
                continue
            job = create_and_dispatch_job(
                workspace=contract.workspace,
                contract=contract,
                task_type=(
                    ContractProcessingJob.TaskType.REANALYZE
                    if action == "reanalyze"
                    else ContractProcessingJob.TaskType.RETRY_PARTIAL
                ),
                user=request.user,
                metadata={"retry_options": retry_options} if action == "retry" else None,
            )
            dispatched.append(str(job.id))
        return Response({"dispatched": dispatched, "skipped": skipped}, status=status.HTTP_200_OK)


class ContractJobsEndpoint(FileLibraryBaseView):
    serializer_class = ContractProcessingJobSerializer
    model = ContractProcessingJob

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, contract_id=None):
        jobs = ContractProcessingJob.objects.filter(workspace__slug=slug)
        if contract_id:
            jobs = jobs.filter(contract_id=contract_id)
        if request.query_params.get("active"):
            jobs = jobs.filter(
                status__in=[ContractProcessingJob.Status.QUEUED, ContractProcessingJob.Status.RUNNING]
            )
        contract_ids = request.query_params.getlist("contract_ids")
        if contract_ids:
            jobs = jobs.filter(contract_id__in=contract_ids)
        serializer = ContractProcessingJobSerializer(jobs.order_by("-created_at")[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContractQueryEndpoint(FileLibraryBaseView):
    serializer_class = ContractQuerySerializer
    model = ContractQuery

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        queries = ContractQuery.objects.filter(workspace__slug=slug).order_by("-created_at")[:50]
        return Response(ContractQuerySerializer(queries, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        user_query = (request.data.get("query") or "").strip()
        if not user_query:
            return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        job = ContractProcessingJob.objects.create(
            workspace=workspace,
            contract=None,
            initiated_by=request.user,
            task_type=ContractProcessingJob.TaskType.QUERY,
            status=ContractProcessingJob.Status.QUEUED,
            current_stage="Waiting in queue",
        )
        query = ContractQuery.objects.create(workspace=workspace, user=request.user, query=user_query, job=job)
        dispatch_contract_query.delay(str(job.id), str(query.id))
        return Response(ContractQuerySerializer(query).data, status=status.HTTP_201_CREATED)
