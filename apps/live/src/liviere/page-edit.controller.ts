/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: server-to-server endpoints used by the Django public pages API
// (apps/api/plane/liviere/live_client.py). Protected by the live-server-secret-key header.
//
// Django owns persistence: live computes the edited document and returns it, Django stores it.
// Live cannot store on its own here, because its Django calls use the editing user's cookie.

import type { Hocuspocus } from "@hocuspocus/server";
import type { Request, Response } from "express";
import * as Y from "yjs";
import { z } from "zod";
import { Controller, Middleware, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { requireSecretKey } from "@/lib/auth-middleware";
import { editLoadedDocument, editStoredDocument } from "./page-edit";
import type { TPageEditResult } from "./page-edit";
import { publishDocumentUpdate } from "./redis-publish";

const editSchema = z
  .object({
    page_id: z.string().uuid(),
    // Stored state from the database, base64; the edit is computed against it
    description_binary: z.string().min(1),
    description_html: z.string().optional(),
    name: z.string().optional(),
  })
  .refine((body) => body.description_html !== undefined || body.name !== undefined, "Nothing to change");

const publishSchema = z.object({
  page_id: z.string().uuid(),
  update: z.string().min(1),
});

@Controller("/liviere/page-edit")
export class LivierePageEditController {
  [key: string]: unknown;
  private readonly hocuspocus: Hocuspocus;

  constructor(hocuspocus: Hocuspocus) {
    this.hocuspocus = hocuspocus;
  }

  /**
   * Applies the edit and returns the resulting document. A document loaded on this instance gets the
   * edit merged in memory, so connected editors see it immediately (see editLoadedDocument); Django
   * stores the returned state.
   */
  @Post("/")
  @Middleware(requireSecretKey)
  async edit(req: Request, res: Response) {
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.issues });
    }
    const { page_id: pageId, description_binary, description_html, name } = parsed.data;
    const edit = { descriptionHtml: description_html, name };
    const storedState = Buffer.from(description_binary, "base64");

    try {
      const document = await this.getLoadedDocument(pageId);
      if (document) {
        const result = editLoadedDocument(document, storedState, edit);
        await publishDocumentUpdate(this.hocuspocus, pageId, Buffer.from(result.update, "base64"));
        logger.info(`LIVIERE_PAGE_EDIT: edited loaded document ${pageId}`);
        return res.status(200).json({ ...toResponse(result), loaded: true });
      }
      const result = editStoredDocument(storedState, edit);
      logger.info(`LIVIERE_PAGE_EDIT: edited stored document ${pageId}`);
      return res.status(200).json({ ...toResponse(result), loaded: false });
    } catch (error) {
      logger.error(`LIVIERE_PAGE_EDIT: failed to edit ${pageId}`, error);
      return res.status(500).json({ message: "Failed to apply the edit" });
    }
  }

  /**
   * Called by Django after it stored the edited state. Replays the update on a document that was
   * loaded in the meantime (a CRDT update is idempotent) and on other live instances via Redis.
   */
  @Post("/publish/")
  @Middleware(requireSecretKey)
  async publish(req: Request, res: Response) {
    const parsed = publishSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.issues });
    }
    const { page_id: pageId } = parsed.data;
    const update = Buffer.from(parsed.data.update, "base64");

    try {
      const document = await this.getLoadedDocument(pageId);
      if (document) Y.applyUpdate(document, update);
      await publishDocumentUpdate(this.hocuspocus, pageId, update);
      return res.status(200).json({ loaded: Boolean(document) });
    } catch (error) {
      logger.error(`LIVIERE_PAGE_EDIT: failed to publish ${pageId}`, error);
      return res.status(500).json({ message: "Failed to publish the update" });
    }
  }

  private async getLoadedDocument(pageId: string) {
    const loading = this.hocuspocus.loadingDocuments.get(pageId);
    if (loading) await loading.catch(() => undefined);
    return this.hocuspocus.documents.get(pageId);
  }
}

const toResponse = (result: TPageEditResult) => ({
  description_binary: result.descriptionBinary,
  description_html: result.descriptionHtml,
  description_json: result.descriptionJson,
  update: result.update,
});
