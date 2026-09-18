/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type { TMentorBinding, TOrgUnit, TOrgUnitMember, TResearchOrgIncomplete } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TOrgUnitPayload = Partial<
  Pick<TOrgUnit, "name" | "unit_type" | "business_category" | "sort_order" | "is_active">
> & {
  parent?: string | null;
};

export type TOrgUnitMemberPayload = {
  user: string;
  org_role?: string;
  is_primary?: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
};

export class ResearchOrgService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getOrgUnits(workspaceSlug: string, params: { include_inactive?: boolean } = {}) {
    return this.get(researchEndpoints.orgUnits(workspaceSlug), { params })
      .then((res) => res?.data as { results: TOrgUnit[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getIncomplete(workspaceSlug: string) {
    return this.get(researchEndpoints.orgIncomplete(workspaceSlug))
      .then((res) => res?.data as TResearchOrgIncomplete)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createOrgUnit(workspaceSlug: string, payload: TOrgUnitPayload) {
    return this.post(researchEndpoints.orgUnits(workspaceSlug), payload)
      .then((res) => res?.data as TOrgUnit)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getOrgUnit(workspaceSlug: string, unitId: string) {
    return this.get(researchEndpoints.orgUnit(workspaceSlug, unitId))
      .then((res) => res?.data as TOrgUnit)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateOrgUnit(workspaceSlug: string, unitId: string, payload: TOrgUnitPayload) {
    return this.patch(researchEndpoints.orgUnit(workspaceSlug, unitId), payload)
      .then((res) => res?.data as TOrgUnit)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteOrgUnit(workspaceSlug: string, unitId: string) {
    return this.delete(researchEndpoints.orgUnit(workspaceSlug, unitId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getOrgUnitMembers(workspaceSlug: string, unitId: string, params: { org_role?: string } = {}) {
    return this.get(researchEndpoints.orgUnitMembers(workspaceSlug, unitId), { params })
      .then((res) => res?.data as { results: TOrgUnitMember[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async addOrgUnitMember(workspaceSlug: string, unitId: string, payload: TOrgUnitMemberPayload) {
    return this.post(researchEndpoints.orgUnitMembers(workspaceSlug, unitId), payload)
      .then((res) => res?.data as TOrgUnitMember)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateOrgUnitMember(
    workspaceSlug: string,
    unitId: string,
    memberId: string,
    payload: Partial<TOrgUnitMemberPayload>
  ) {
    return this.patch(researchEndpoints.orgUnitMember(workspaceSlug, unitId, memberId), payload)
      .then((res) => res?.data as TOrgUnitMember)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async removeOrgUnitMember(workspaceSlug: string, unitId: string, memberId: string) {
    return this.delete(researchEndpoints.orgUnitMember(workspaceSlug, unitId, memberId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async transferPi(workspaceSlug: string, unitId: string, userIds: string[]) {
    return this.post(researchEndpoints.orgUnitPi(workspaceSlug, unitId), { user_ids: userIds })
      .then((res) => res?.data as { results: TOrgUnitMember[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMentorBindings(
    workspaceSlug: string,
    params: { mentee?: string; mentor?: string; org_unit?: string; active_only?: boolean } = {}
  ) {
    return this.get(researchEndpoints.mentors(workspaceSlug), { params })
      .then((res) => res?.data as { results: TMentorBinding[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createMentorBinding(
    workspaceSlug: string,
    payload: {
      mentee: string;
      mentor: string;
      org_unit?: string | null;
      is_primary_advisor?: boolean;
      effective_to?: string | null;
    }
  ) {
    return this.post(researchEndpoints.mentors(workspaceSlug), payload)
      .then((res) => res?.data as TMentorBinding)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteMentorBinding(workspaceSlug: string, bindingId: string) {
    return this.delete(researchEndpoints.mentor(workspaceSlug, bindingId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
