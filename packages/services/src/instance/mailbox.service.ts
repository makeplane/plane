/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// gizmo imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TMailbox,
  TMailboxCreatePayload,
  TMailboxUpdatePayload,
  TMailAlias,
  TMailAliasCreatePayload,
  TMailConfig,
} from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing the self-hosted mail stack (mailboxes, aliases)
 * from the god-mode panel. All endpoints require instance-admin permission.
 * @extends {APIService}
 */
export class MailboxService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /** Returns mail-stack runtime info (domain, local mode). */
  async config(): Promise<TMailConfig> {
    return this.get("/api/instances/mail/config/")
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Lists all virtual mailboxes. */
  async list(): Promise<TMailbox[]> {
    return this.get("/api/instances/mailboxes/")
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Creates a new mailbox. */
  async create(data: TMailboxCreatePayload): Promise<TMailbox> {
    return this.post("/api/instances/mailboxes/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Updates a mailbox (reset password, toggle active, change quota). */
  async update(mailboxId: string, data: TMailboxUpdatePayload): Promise<TMailbox> {
    return this.patch(`/api/instances/mailboxes/${mailboxId}/`, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Deletes a mailbox. */
  async destroy(mailboxId: string): Promise<void> {
    return this.delete(`/api/instances/mailboxes/${mailboxId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Lists all virtual aliases. */
  async listAliases(): Promise<TMailAlias[]> {
    return this.get("/api/instances/mail-aliases/")
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Creates a new alias. */
  async createAlias(data: TMailAliasCreatePayload): Promise<TMailAlias> {
    return this.post("/api/instances/mail-aliases/", data)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Deletes an alias. */
  async destroyAlias(aliasId: string): Promise<void> {
    return this.delete(`/api/instances/mail-aliases/${aliasId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
