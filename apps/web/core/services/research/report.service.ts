/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type {
  TPeriodicReport,
  TReportAttachment,
  TReportReviewLog,
  TReportSummary,
  TReportTemplate,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TReportListParams = {
  period_key?: string;
  status?: string;
  report_type?: string;
  org_unit?: string;
  owner?: string;
};

export type TReportCreatePayload = {
  report_type: string;
  period_key?: string;
  template?: string | null;
  visibility?: string;
  is_backfill?: boolean;
};

export class ResearchReportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getReports(workspaceSlug: string, params: TReportListParams = {}) {
    return this.get(researchEndpoints.reports(workspaceSlug), { params })
      .then((res) => res?.data as { results: TPeriodicReport[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createReport(workspaceSlug: string, payload: TReportCreatePayload) {
    return this.post(researchEndpoints.reports(workspaceSlug), payload)
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReport(workspaceSlug: string, reportId: string) {
    return this.get(researchEndpoints.report(workspaceSlug, reportId))
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateReport(workspaceSlug: string, reportId: string, payload: Partial<TPeriodicReport>) {
    return this.patch(researchEndpoints.report(workspaceSlug, reportId), payload)
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async submitReport(workspaceSlug: string, reportId: string, comment = "") {
    return this.post(researchEndpoints.reportSubmit(workspaceSlug, reportId), { comment })
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async returnReport(workspaceSlug: string, reportId: string, comment: string) {
    return this.post(researchEndpoints.reportReturn(workspaceSlug, reportId), { comment })
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async acceptReport(workspaceSlug: string, reportId: string, comment = "") {
    return this.post(researchEndpoints.reportAccept(workspaceSlug, reportId), { comment })
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReportHistory(workspaceSlug: string, reportId: string) {
    return this.get(researchEndpoints.reportHistory(workspaceSlug, reportId))
      .then((res) => res?.data as { results: TReportReviewLog[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReportAccess(workspaceSlug: string, reportId: string) {
    return this.get(researchEndpoints.reportAccess(workspaceSlug, reportId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateReportAccess(
    workspaceSlug: string,
    reportId: string,
    payload: { visibility?: string; grants?: { grantee_user?: string; grantee_org_unit?: string }[] }
  ) {
    return this.patch(researchEndpoints.reportAccess(workspaceSlug, reportId), payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getReportAttachments(workspaceSlug: string, reportId: string) {
    return this.get(researchEndpoints.reportAttachments(workspaceSlug, reportId))
      .then((res) => res?.data as { results: TReportAttachment[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async registerReportAttachment(
    workspaceSlug: string,
    reportId: string,
    payload: { asset_id: string; kind?: string; file_name?: string }
  ) {
    return this.post(researchEndpoints.reportAttachments(workspaceSlug, reportId), payload)
      .then((res) => res?.data as TReportAttachment)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteReportAttachment(workspaceSlug: string, reportId: string, attachmentId: string) {
    return this.delete(researchEndpoints.reportAttachment(workspaceSlug, reportId, attachmentId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async importMarkdown(workspaceSlug: string, reportId: string, payload: { content: string; file_name?: string }) {
    return this.post(researchEndpoints.reportImportMarkdown(workspaceSlug, reportId), payload)
      .then((res) => res?.data as TPeriodicReport)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getSummary(
    workspaceSlug: string,
    params: { period_key?: string; report_type?: string; org_unit?: string } = {}
  ) {
    return this.get(researchEndpoints.reportSummary(workspaceSlug), { params })
      .then((res) => res?.data as TReportSummary)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getTemplates(workspaceSlug: string, params: { report_type?: string } = {}) {
    return this.get(researchEndpoints.reportTemplates(workspaceSlug), { params })
      .then((res) => res?.data as { results: TReportTemplate[]; count: number })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createTemplate(
    workspaceSlug: string,
    payload: { name: string; report_type: string; content_json?: Record<string, unknown>; is_default?: boolean }
  ) {
    return this.post(researchEndpoints.reportTemplates(workspaceSlug), payload)
      .then((res) => res?.data as TReportTemplate)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateTemplate(workspaceSlug: string, templateId: string, payload: Partial<TReportTemplate>) {
    return this.patch(researchEndpoints.reportTemplate(workspaceSlug, templateId), payload)
      .then((res) => res?.data as TReportTemplate)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteTemplate(workspaceSlug: string, templateId: string) {
    return this.delete(researchEndpoints.reportTemplate(workspaceSlug, templateId))
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
