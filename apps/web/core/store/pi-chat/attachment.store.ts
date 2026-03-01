/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { debounce, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { PiChatService } from "@/services/pi-chat.service";
import type { TPiAttachment } from "@/types/pi-chat";
import type { IPiChatStore } from "./pi-chat";
// services

export type TAttachmentUploadStatus = TPiAttachment & {
  progress: number;
};

export interface IPiChatAttachmentStoreActions {
  // actions
  addAttachments: (attachments: TPiAttachment[]) => void;
  createAttachment: (file: File, workspaceId: string, chatId: string) => Promise<TPiAttachment | void>;
}

export interface IPiChatAttachmentStore extends IPiChatAttachmentStoreActions {
  // observables
  attachmentMap: Map<string, TPiAttachment>;
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>>;
  // helper methods
  getAttachmentsUploadStatusByChatId: (chatId: string) => TAttachmentUploadStatus[] | undefined;
  getAttachmentById: (attachmentId: string) => TPiAttachment | undefined;
}

export class PiChatAttachmentStore implements IPiChatAttachmentStore {
  // observables
  attachmentMap: Map<string, TPiAttachment> = new Map();
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>> = {};
  // root store
  rootPiChatStore: IPiChatStore;
  // services
  piChatAttachmentService: PiChatService;

  constructor(rootStore: IPiChatStore) {
    makeObservable(this, {
      // observables
      attachmentMap: observable,
      attachmentsUploadStatusMap: observable,
      // actions
      addAttachments: action.bound,
      createAttachment: action,
    });
    // root store
    this.rootPiChatStore = rootStore;
    // services
    this.piChatAttachmentService = new PiChatService();
  }

  // helper methods
  getAttachmentsUploadStatusByChatId = computedFn((chatId: string) => {
    if (!chatId) return undefined;
    const attachmentsUploadStatus = Object.values(this.attachmentsUploadStatusMap[chatId] ?? {});
    return attachmentsUploadStatus ?? undefined;
  });

  getAttachmentById = computedFn((attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap.get(attachmentId);
  });

  // actions
  addAttachments = (attachments: TPiAttachment[]) => {
    if (attachments && attachments.length > 0) {
      runInAction(() => {
        attachments.forEach((attachment) => this.attachmentMap.set(attachment.id, attachment));
      });
    }
  };

  debouncedUpdateProgress = debounce((chatId: string, tempId: string, progress: number) => {
    runInAction(() => {
      set(this.attachmentsUploadStatusMap, [chatId, tempId, "progress"], progress);
    });
  }, 16);

  createAttachment = async (file: File, workspaceId: string, chatId: string) => {
    const tempId = uuidv4();
    try {
      // update attachment upload status
      runInAction(() => {
        set(this.attachmentsUploadStatusMap, [chatId, tempId], {
          id: tempId,
          filename: file.name,
          progress: 0,
          file_size: file.size,
          file_type: file.type,
          attachment_url: URL.createObjectURL(file),
        });
      });
      const response = await this.piChatAttachmentService.uploadAttachment(
        file,
        workspaceId,
        chatId,
        (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(chatId, tempId, progressPercentage);
        }
      );
      if (response && response.id) {
        runInAction(() => {
          this.attachmentMap.set(response.id, response);
        });
      }

      return response;
    } catch (error) {
      console.error("Error in uploading chat attachment:", error);
      throw error;
    } finally {
      // Cancel any pending debounced updates
      this.debouncedUpdateProgress.cancel();

      // Remove the attachment from upload status map
      runInAction(() => {
        if (this.attachmentsUploadStatusMap[chatId] && this.attachmentsUploadStatusMap[chatId][tempId]) {
          delete this.attachmentsUploadStatusMap[chatId][tempId];
        }
      });
    }
  };

  fetchAttachmentsByChatId = async (chatId: string) => {
    const response = await this.piChatAttachmentService.listAttachments(chatId);
    response.forEach((attachment) => {
      this.addAttachments([attachment]);
    });
  };
}
