/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Mirrors apps/api/plane/db/models/contract.py (crm-new aligned schema)

export type TContractProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
export type TContractStatus = "VIGENTE" | "FINALIZADO" | "NO_ESPECIFICADO";
export type TContractType = "ARRENDAMIENTOS" | "ALQUILERES" | "VEHICULOS" | "SERVICIOS" | "ARTISTAS";
export type TYesNoUnspecified = "SI" | "NO" | "NO_ESPECIFICADO";

export type TContract = {
  id: string;
  workspace_id: string;
  file_asset_id: string | null;
  thumbnail_asset_id: string | null;
  file_name: string | null;
  processing_status: TContractProcessingStatus;
  proposed_data: Record<string, unknown> | null;
  ai_model_used: string | null;
  processed_at: string | null;
  text_extracted_at: string | null;
  // AI-extracted, user-editable fields
  titulo: string | null;
  resumen_general: string | null;
  nombre_grupo: string | null;
  /** Comma-separated plain text (crm-new String @db.Text) */
  artistas: string | null;
  testigos: string | null;
  involucrados: string | null;
  es_notariado: boolean | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  es_posible_expandirlo: TYesNoUnspecified;
  tiempo_extension_posible: string | null;
  expansion_time_description: string | null;
  fecha_fin_efectiva: string | null;
  estatus_contrato: TContractStatus;
  tipo_contrato: TContractType | null;
  periodo_coleccion: TYesNoUnspecified | null;
  collection_period_description: string | null;
  collection_period_duration: string | null;
  periodo_retencion: TYesNoUnspecified | null;
  retention_period_description: string | null;
  retention_period_duration: string | null;
  created_at: string;
  updated_at: string;
};

export type TContractUpdatePayload = Partial<
  Pick<
    TContract,
    | "titulo"
    | "resumen_general"
    | "nombre_grupo"
    | "artistas"
    | "testigos"
    | "involucrados"
    | "es_notariado"
    | "fecha_inicio"
    | "fecha_fin"
    | "es_posible_expandirlo"
    | "tiempo_extension_posible"
    | "expansion_time_description"
    | "fecha_fin_efectiva"
    | "estatus_contrato"
    | "tipo_contrato"
    | "periodo_coleccion"
    | "collection_period_description"
    | "collection_period_duration"
    | "periodo_retencion"
    | "retention_period_description"
    | "retention_period_duration"
  >
>;

export type TContractJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type TContractJobTaskType = "EXTRACT_FULL" | "RETRY_PARTIAL" | "REANALYZE" | "QUERY";

export type TContractJob = {
  id: string;
  workspace_id: string;
  contract_id: string | null;
  initiated_by_id: string | null;
  task_type: TContractJobTaskType;
  status: TContractJobStatus;
  progress: number;
  current_stage: string | null;
  workflow_instance_id: string | null;
  error: { message?: string; stage?: string } | null;
  metadata: Record<string, unknown> | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TContractQueryMatch = {
  contract_id: string;
  title: string;
  artists: string | null;
  start_date: string | null;
  end_date: string | null;
  final_end_date: string | null;
  reason: string;
};

export type TContractQuery = {
  id: string;
  workspace_id: string;
  user_id: string;
  query: string;
  status: TContractJobStatus;
  result: { summary?: string; matches?: TContractQueryMatch[]; scanned_count?: number } | null;
  emailed_at: string | null;
  job_id: string | null;
  created_at: string;
};

export type TContractRetryOptions = {
  extract_text?: boolean;
  generate_embeddings?: boolean;
  ai_analysis?: boolean;
  extract_thumbnail?: boolean;
};

export type TContractFilters = {
  search?: string;
  person?: string;
  artist?: string;
  year?: string;
  /** OR'd within the group (multi-value) */
  estatus?: TContractStatus[];
  tipo?: TContractType[];
  processing_status?: TContractProcessingStatus[];
  fecha_fin_efectiva_after?: string;
  fecha_fin_efectiva_before?: string;
};
