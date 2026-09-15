/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type {
  TStageGate,
  TStageGatePhase,
  TStageInstance,
  TStageMaterial,
  TStageMaterialVersion,
  TStageRequirement,
  TStageTransition,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TStageListResponse = {
  results: TStageInstance[];
  count: number;
  current_stage: string | null;
  project: string;
  workflow_status: string;
  stage_sequence: string[];
  created?: boolean;
};

export type TStageMaterialCreatePayload = {
  material_type: string;
  title?: string;
  description_json?: Record<string, unknown>;
  description_html?: string;
  visibility?: string;
};

export type TStageMaterialUpdatePayload = {
  title?: string;
  description_json?: Record<string, unknown>;
  description_html?: string;
  visibility?: string;
  reason?: string;
};

export type TStageRequirementUpdate = {
  stage: string;
  code: string;
  requirement_type?: string;
  threshold?: number | null;
  is_blocking?: boolean;
  is_active?: boolean;
  org_unit?: string | null;
};

export class ResearchStageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectStages(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.projectStages(workspaceSlug, projectId))
      .then((res) => res?.data as TStageListResponse)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createProjectStages(workspaceSlug: string, projectId: string) {
    return this.post(researchEndpoints.projectStages(workspaceSlug, projectId), {})
      .then((res) => res?.data as TStageListResponse)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getStage(workspaceSlug: string, stageId: string) {
    return this.get(researchEndpoints.stage(workspaceSlug, stageId))
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getGate(workspaceSlug: string, stageId: string, phase: TStageGatePhase = "submit") {
    return this.get(researchEndpoints.stageGate(workspaceSlug, stageId), { params: { phase } })
      .then((res) => res?.data as TStageGate)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getTransitions(workspaceSlug: string, stageId: string) {
    return this.get(researchEndpoints.stageTransitions(workspaceSlug, stageId))
      .then((res) => res?.data as { results: TStageTransition[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async enterStage(workspaceSlug: string, stageId: string) {
    return this.post(researchEndpoints.stageEnter(workspaceSlug, stageId), {})
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async submitStage(workspaceSlug: string, stageId: string) {
    return this.post(researchEndpoints.stageSubmit(workspaceSlug, stageId), {})
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async returnStage(workspaceSlug: string, stageId: string, reason: string) {
    return this.post(researchEndpoints.stageReturn(workspaceSlug, stageId), { reason })
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async passStage(workspaceSlug: string, stageId: string) {
    return this.post(researchEndpoints.stagePass(workspaceSlug, stageId), {})
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async reopenStage(workspaceSlug: string, stageId: string, reason: string, confirm = false) {
    return this.post(researchEndpoints.stageReopen(workspaceSlug, stageId), { reason, confirm })
      .then((res) => res?.data as TStageInstance)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMaterials(workspaceSlug: string, stageId: string) {
    return this.get(researchEndpoints.stageMaterials(workspaceSlug, stageId))
      .then((res) => res?.data as { results: TStageMaterial[]; count: number; required_materials: string[] })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createMaterial(workspaceSlug: string, stageId: string, payload: TStageMaterialCreatePayload) {
    return this.post(researchEndpoints.stageMaterials(workspaceSlug, stageId), payload)
      .then((res) => res?.data as TStageMaterial)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMaterial(workspaceSlug: string, materialId: string) {
    return this.get(researchEndpoints.material(workspaceSlug, materialId))
      .then((res) => res?.data as TStageMaterial & { stage?: TStageInstance })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateMaterial(workspaceSlug: string, materialId: string, payload: TStageMaterialUpdatePayload) {
    return this.patch(researchEndpoints.material(workspaceSlug, materialId), payload)
      .then((res) => res?.data as TStageMaterial)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async submitMaterial(workspaceSlug: string, materialId: string) {
    return this.post(researchEndpoints.materialSubmit(workspaceSlug, materialId), {})
      .then((res) => res?.data as TStageMaterial)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMaterialVersions(workspaceSlug: string, materialId: string) {
    return this.get(researchEndpoints.materialVersions(workspaceSlug, materialId))
      .then((res) => res?.data as { results: TStageMaterialVersion[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getStageRequirements(workspaceSlug: string, stage?: string) {
    return this.get(researchEndpoints.stageRequirements(workspaceSlug), { params: stage ? { stage } : {} })
      .then((res) => res?.data as { results: TStageRequirement[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateStageRequirements(workspaceSlug: string, items: TStageRequirementUpdate[]) {
    return this.patch(researchEndpoints.stageRequirements(workspaceSlug), { items })
      .then((res) => res?.data as { results: unknown[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
