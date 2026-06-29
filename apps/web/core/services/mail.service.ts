/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TMailAccountCreatePayload,
  TMailAccountLoginPayload,
  TMailComposePayload,
  TMailFilterRule,
  TMailFolder,
  TMailForwarding,
  TMailLabel,
  TMailMeConfig,
  TMailMessageDetail,
  TMailMessagesResponse,
  TMailPreference,
  TMailSavedSearch,
  TMailSendResponse,
  TMailSignature,
  TMailTemplate,
  TMailUploadedAttachment,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class MailService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async me(): Promise<TMailMeConfig> {
    return this.get("/api/mail/config/me/")
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createAccount(payload: TMailAccountCreatePayload): Promise<TMailMeConfig> {
    return this.post("/api/mail/accounts/", payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async loginAccount(payload: TMailAccountLoginPayload): Promise<TMailMeConfig> {
    return this.post("/api/mail/session/", payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async folders(): Promise<TMailFolder[]> {
    return this.get("/api/mail/folders/")
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async messages(folderKey: string, params: Record<string, unknown> = {}): Promise<TMailMessagesResponse> {
    return this.get(`/api/mail/folders/${folderKey}/messages/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async message(folderKey: string, uid: string): Promise<TMailMessageDetail> {
    return this.get(`/api/mail/folders/${folderKey}/messages/${uid}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async setFlags(folderKey: string, uid: string, data: { read?: boolean; starred?: boolean }): Promise<void> {
    return this.post(`/api/mail/folders/${folderKey}/messages/${uid}/flags/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async move(srcFolder: string, dstFolder: string, uids: string[]): Promise<void> {
    return this.post("/api/mail/messages/move/", { src_folder: srcFolder, dst_folder: dstFolder, uids })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteMessages(srcFolder: string, uids: string[], permanent = false): Promise<void> {
    return this.post("/api/mail/messages/delete/", { src_folder: srcFolder, uids, permanent })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async search(params: Record<string, unknown>): Promise<TMailMessagesResponse> {
    return this.get("/api/mail/search/", { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async send(payload: TMailComposePayload): Promise<TMailSendResponse> {
    return this.post("/api/mail/send/", payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async saveDraft(payload: TMailComposePayload): Promise<void> {
    return this.post("/api/mail/drafts/", payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async uploadAttachment(file: File): Promise<TMailUploadedAttachment> {
    const data = new FormData();
    data.append("file", file);
    return this.post("/api/mail/attachments/upload/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async signatures(): Promise<TMailSignature[]> {
    return this.get("/api/mail/signatures/").then((res) => res?.data);
  }

  async createSignature(data: Partial<TMailSignature>): Promise<TMailSignature> {
    return this.post("/api/mail/signatures/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateSignature(id: string, data: Partial<TMailSignature>): Promise<TMailSignature> {
    return this.patch(`/api/mail/signatures/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteSignature(id: string): Promise<void> {
    return this.delete(`/api/mail/signatures/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async templates(): Promise<TMailTemplate[]> {
    return this.get("/api/mail/templates/").then((res) => res?.data);
  }

  async createTemplate(data: Partial<TMailTemplate>): Promise<TMailTemplate> {
    return this.post("/api/mail/templates/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateTemplate(id: string, data: Partial<TMailTemplate>): Promise<TMailTemplate> {
    return this.patch(`/api/mail/templates/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.delete(`/api/mail/templates/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async filters(): Promise<TMailFilterRule[]> {
    return this.get("/api/mail/filters/").then((res) => res?.data);
  }

  async createFilter(data: Partial<TMailFilterRule>): Promise<TMailFilterRule> {
    return this.post("/api/mail/filters/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateFilter(id: string, data: Partial<TMailFilterRule>): Promise<TMailFilterRule> {
    return this.patch(`/api/mail/filters/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteFilter(id: string): Promise<void> {
    return this.delete(`/api/mail/filters/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async labels(): Promise<TMailLabel[]> {
    return this.get("/api/mail/labels/").then((res) => res?.data);
  }

  async createLabel(data: Partial<TMailLabel>): Promise<TMailLabel> {
    return this.post("/api/mail/labels/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateLabel(id: string, data: Partial<TMailLabel>): Promise<TMailLabel> {
    return this.patch(`/api/mail/labels/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteLabel(id: string): Promise<void> {
    return this.delete(`/api/mail/labels/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async savedSearches(): Promise<TMailSavedSearch[]> {
    return this.get("/api/mail/saved-searches/").then((res) => res?.data);
  }

  async createSavedSearch(data: Partial<TMailSavedSearch>): Promise<TMailSavedSearch> {
    return this.post("/api/mail/saved-searches/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteSavedSearch(id: string): Promise<void> {
    return this.delete(`/api/mail/saved-searches/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async forwarding(): Promise<TMailForwarding> {
    return this.get("/api/mail/forwarding/").then((res) => res?.data);
  }

  async patchForwarding(data: Partial<TMailForwarding>): Promise<TMailForwarding> {
    return this.patch("/api/mail/forwarding/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async preferences(): Promise<TMailPreference> {
    return this.get("/api/mail/preferences/").then((res) => res?.data);
  }

  async patchPreferences(data: Partial<TMailPreference>): Promise<TMailPreference> {
    return this.patch("/api/mail/preferences/", data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
