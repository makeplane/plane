/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TContractProcessingStatus, TContractStatus, TContractType, TYesNoUnspecified } from "@plane/types";

// i18n keys live under file_library.contracts.*

export const CONTRACT_STATUS_OPTIONS: { value: TContractStatus; i18nKey: string }[] = [
  { value: "VIGENTE", i18nKey: "file_library.contracts.status.vigente" },
  { value: "FINALIZADO", i18nKey: "file_library.contracts.status.finalizado" },
  { value: "NO_ESPECIFICADO", i18nKey: "file_library.contracts.status.no_especificado" },
];

export const CONTRACT_TYPE_OPTIONS: { value: TContractType; i18nKey: string }[] = [
  { value: "ARRENDAMIENTOS", i18nKey: "file_library.contracts.type.arrendamientos" },
  { value: "ALQUILERES", i18nKey: "file_library.contracts.type.alquileres" },
  { value: "VEHICULOS", i18nKey: "file_library.contracts.type.vehiculos" },
  { value: "SERVICIOS", i18nKey: "file_library.contracts.type.servicios" },
  { value: "ARTISTAS", i18nKey: "file_library.contracts.type.artistas" },
];

export const PROCESSING_STATUS_OPTIONS: { value: TContractProcessingStatus; i18nKey: string }[] = [
  { value: "PENDING", i18nKey: "file_library.contracts.processing.pending" },
  { value: "PROCESSING", i18nKey: "file_library.contracts.processing.processing" },
  { value: "COMPLETED", i18nKey: "file_library.contracts.processing.completed" },
  { value: "ERROR", i18nKey: "file_library.contracts.processing.error" },
];

export const YES_NO_UNSPECIFIED_OPTIONS: { value: TYesNoUnspecified; i18nKey: string }[] = [
  { value: "SI", i18nKey: "file_library.contracts.yes" },
  { value: "NO", i18nKey: "file_library.contracts.no" },
  { value: "NO_ESPECIFICADO", i18nKey: "file_library.contracts.status.no_especificado" },
];

export const RETRY_OPTIONS: {
  key: "extract_text" | "generate_embeddings" | "ai_analysis" | "extract_thumbnail" | "tags";
  i18nKey: string;
  hintKey?: string;
}[] = [
  { key: "extract_text", i18nKey: "file_library.contracts.retry.extract_text" },
  { key: "generate_embeddings", i18nKey: "file_library.contracts.retry.generate_embeddings" },
  { key: "ai_analysis", i18nKey: "file_library.contracts.retry.ai_analysis" },
  { key: "extract_thumbnail", i18nKey: "file_library.contracts.retry.extract_thumbnail" },
  {
    key: "tags",
    i18nKey: "file_library.contracts.retry.tags",
    hintKey: "file_library.contracts.retry.tags_hint",
  },
];
