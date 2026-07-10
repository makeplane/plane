# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from pgvector.django import VectorField

from .base import BaseModel

# Matches the OpenAI text-embedding-3-small dimensionality; changing this is a
# destructive migration (every chunk must be re-embedded)
EMBEDDING_DIMENSIONS = 1536


class ExpansionPossibility(models.TextChoices):
    SI = "SI", "Sí"
    NO = "NO", "No"
    NO_ESPECIFICADO = "NO_ESPECIFICADO", "No especificado"


class RetentionAndCollectionPeriod(models.TextChoices):
    SI = "SI", "Sí"
    NO = "NO", "No"
    NO_ESPECIFICADO = "NO_ESPECIFICADO", "No especificado"


class ContractStatus(models.TextChoices):
    VIGENTE = "VIGENTE", "Vigente"
    FINALIZADO = "FINALIZADO", "Finalizado"
    NO_ESPECIFICADO = "NO_ESPECIFICADO", "No especificado"


class ContractType(models.TextChoices):
    ARRENDAMIENTOS = "ARRENDAMIENTOS", "Arrendamientos"
    ALQUILERES = "ALQUILERES", "Alquileres"
    VEHICULOS = "VEHICULOS", "Vehículos"
    SERVICIOS = "SERVICIOS", "Servicios"
    ARTISTAS = "ARTISTAS", "Artistas"


class ContractStatusIAProcessed(models.TextChoices):
    PENDING = "PENDING", "Pendiente"
    PROCESSING = "PROCESSING", "Procesando"
    COMPLETED = "COMPLETED", "Completado"
    ERROR = "ERROR", "Error"


class Contract(BaseModel):
    """A contract detected in the file library (a PDF linked to the protected
    "Contratos" category). AI-extracted fields mirror the crm-new reference
    Prisma schema field-for-field.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="contracts")
    file_asset = models.OneToOneField("db.FileAsset", on_delete=models.CASCADE, related_name="contract")
    thumbnail_asset = models.ForeignKey(
        "db.FileAsset", on_delete=models.SET_NULL, null=True, blank=True, related_name="contract_thumbnails"
    )

    # Extraction pipeline output
    extracted_text = models.TextField(null=True, blank=True)
    text_extracted_at = models.DateTimeField(null=True, blank=True)

    # AI-extracted fields (aligned to the crm-new Prisma schema)
    titulo = models.CharField(max_length=500, null=True, blank=True)
    resumen_general = models.TextField(null=True, blank=True)
    nombre_grupo = models.CharField(max_length=255, null=True, blank=True)
    # Comma-separated plain text (String @db.Text in the reference), not JSON
    artistas = models.TextField(null=True, blank=True)
    testigos = models.TextField(null=True, blank=True)
    involucrados = models.TextField(null=True, blank=True)
    es_notariado = models.BooleanField(null=True, default=False)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    es_posible_expandirlo = models.CharField(
        max_length=30, choices=ExpansionPossibility.choices, default=ExpansionPossibility.NO_ESPECIFICADO
    )
    tiempo_extension_posible = models.CharField(max_length=255, null=True, blank=True)
    expansion_time_description = models.TextField(null=True, blank=True)
    # Effective end considering auto-extension clauses; computed server-side
    # from fecha_fin + tiempo_extension_meses (normalized int the AI returns)
    fecha_fin_efectiva = models.DateField(null=True, blank=True)
    estatus_contrato = models.CharField(
        max_length=30, choices=ContractStatus.choices, default=ContractStatus.NO_ESPECIFICADO, null=True
    )
    tipo_contrato = models.CharField(max_length=30, choices=ContractType.choices, null=True, blank=True)
    periodo_coleccion = models.CharField(
        max_length=30, choices=RetentionAndCollectionPeriod.choices, null=True, blank=True
    )
    collection_period_description = models.TextField(null=True, blank=True)
    collection_period_duration = models.CharField(max_length=255, null=True, blank=True)
    periodo_retencion = models.CharField(
        max_length=30, choices=RetentionAndCollectionPeriod.choices, null=True, blank=True
    )
    retention_period_description = models.TextField(null=True, blank=True)
    retention_period_duration = models.CharField(max_length=255, null=True, blank=True)

    # Pipeline state
    processing_status = models.CharField(
        max_length=30, choices=ContractStatusIAProcessed.choices, default=ContractStatusIAProcessed.PENDING
    )
    # Re-analysis result awaiting user confirmation before overwriting live fields
    proposed_data = models.JSONField(null=True, blank=True)
    ai_model_used = models.CharField(max_length=255, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
        db_table = "contracts"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "processing_status"], name="contract_ws_status_idx"),
            models.Index(fields=["workspace", "fecha_fin_efectiva"], name="contract_ws_fin_efectiva_idx"),
        ]

    def __str__(self):
        return str(self.titulo or self.id)


class ContractProcessingJob(BaseModel):
    """One pipeline run over a contract (full extraction, selective retry,
    re-analysis or NL query). Drives the real-time progress UI via polling.
    """

    class TaskType(models.TextChoices):
        EXTRACT_FULL = "EXTRACT_FULL", "Full extraction"
        RETRY_PARTIAL = "RETRY_PARTIAL", "Selective retry"
        REANALYZE = "REANALYZE", "Re-analysis"
        QUERY = "QUERY", "NL query"

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="contract_jobs")
    contract = models.ForeignKey(
        "db.Contract", on_delete=models.CASCADE, null=True, blank=True, related_name="jobs"
    )
    initiated_by = models.ForeignKey(
        "db.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="contract_jobs"
    )
    task_type = models.CharField(max_length=30, choices=TaskType.choices)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.QUEUED)
    progress = models.PositiveSmallIntegerField(default=0)
    current_stage = models.CharField(max_length=255, null=True, blank=True)
    # Cloudflare Workflow instance id running this job
    workflow_instance_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    # {message, stage} of the failure, for "see where it failed" UX
    error = models.JSONField(null=True, blank=True)
    # retryOptions, model used, etc.
    metadata = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Contract Processing Job"
        verbose_name_plural = "Contract Processing Jobs"
        db_table = "contract_processing_jobs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.task_type} {self.status} ({self.contract_id})"


class ContractChunk(BaseModel):
    """A chunk of the contract's extracted text with its embedding, for
    vector search (next iteration's chatbots).
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="contract_chunks")
    contract = models.ForeignKey("db.Contract", on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = VectorField(dimensions=EMBEDDING_DIMENSIONS)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["contract", "chunk_index"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_contract_chunk_index_when_not_deleted",
            )
        ]
        verbose_name = "Contract Chunk"
        verbose_name_plural = "Contract Chunks"
        db_table = "contract_chunks"
        ordering = ("chunk_index",)

    def __str__(self):
        return f"{self.contract_id}#{self.chunk_index}"


class ContractQuery(BaseModel):
    """A natural-language query fanned out across every contract of the
    workspace; the result is emailed to the requesting user.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="contract_queries")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="contract_queries")
    query = models.TextField()
    status = models.CharField(
        max_length=30, choices=ContractProcessingJob.Status.choices, default=ContractProcessingJob.Status.QUEUED
    )
    # {matches: [...], summary, scanned_count}
    result = models.JSONField(null=True, blank=True)
    emailed_at = models.DateTimeField(null=True, blank=True)
    job = models.ForeignKey(
        "db.ContractProcessingJob", on_delete=models.SET_NULL, null=True, blank=True, related_name="queries"
    )

    class Meta:
        verbose_name = "Contract Query"
        verbose_name_plural = "Contract Queries"
        db_table = "contract_queries"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.query)[:60]
