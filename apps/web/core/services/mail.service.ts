/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
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

  async send(payload: TMailComposePayload): Promise<{ queued: boolean }> {
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

  async templates(): Promise<TMailTemplate[]> {
    return this.get("/api/mail/templates/").then((res) => res?.data);
  }

  async filters(): Promise<TMailFilterRule[]> {
    return this.get("/api/mail/filters/").then((res) => res?.data);
  }

  async labels(): Promise<TMailLabel[]> {
    return this.get("/api/mail/labels/").then((res) => res?.data);
  }

  async savedSearches(): Promise<TMailSavedSearch[]> {
    return this.get("/api/mail/saved-searches/").then((res) => res?.data);
  }

  async forwarding(): Promise<TMailForwarding> {
    return this.get("/api/mail/forwarding/").then((res) => res?.data);
  }

  async preferences(): Promise<TMailPreference> {
    return this.get("/api/mail/preferences/").then((res) => res?.data);
  }

  async patchPreferences(data: Partial<TMailPreference>): Promise<TMailPreference> {
    return this.patch("/api/mail/preferences/", data).then((res) => res?.data);
  }
}
