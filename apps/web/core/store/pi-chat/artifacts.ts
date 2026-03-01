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

import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
// plane web imports
import { computedFn } from "mobx-utils";
import { PiChatService } from "@/services/pi-chat.service";
import type { TArtifact, TUpdatedArtifact } from "@/types";

type TArtifactVersionHistory = {
  original: TArtifact;
  updated: TUpdatedArtifact;
};

export interface IArtifactsStore {
  chatArtifactsMap: Map<string, string[]>; // chat_id -> artifacts
  versionHistory: Map<string, TArtifactVersionHistory>; // artifact_id -> version history
  getGroupedArtifacts: (artifactIds: string[]) => {
    successful: TArtifact[];
    failed: TArtifact[];
  };
  getArtifact: (artifactId: string) => TArtifact | undefined;
  getArtifactsByChatId: (chatId: string) => (TArtifact | undefined)[];
  getArtifactByVersion: (
    artifactId: string,
    versionId: "original" | "updated"
  ) => TArtifact | TUpdatedArtifact | undefined;
  fetchArtifactsByChatId: (chatId: string) => void;
  updateArtifact: (artifactId: string, versionId: "original" | "updated", data: TUpdatedArtifact) => void;
}

export class ArtifactsStore implements IArtifactsStore {
  versionHistory: Map<string, TArtifactVersionHistory> = new Map();
  chatArtifactsMap: Map<string, string[]> = new Map();
  //services
  piChatService;

  constructor() {
    makeObservable(this, {
      //observables
      versionHistory: observable,
      chatArtifactsMap: observable,
      // computed
      // actions
      fetchArtifactsByChatId: action,
      initArtifacts: action,
      updateArtifact: action,
    });

    //services
    this.piChatService = new PiChatService();
  }

  getGroupedArtifacts = computedFn((artifactIds: string[]) => {
    const response: {
      successful: TArtifact[];
      failed: TArtifact[];
    } = {
      successful: [],
      failed: [],
    };

    artifactIds.forEach((artifactId) => {
      const artifact = this.getArtifact(artifactId);
      if (!artifact) return;
      if (artifact?.success) {
        response.successful.push(artifact);
      } else {
        response.failed.push(artifact);
      }
    });
    return response;
  });

  getArtifactsByChatId = computedFn(
    (chatId: string) => this.chatArtifactsMap.get(chatId)?.map((artifactId) => this.getArtifact(artifactId)) || []
  );

  getArtifact = computedFn((artifactId: string) => this.versionHistory.get(artifactId)?.original);

  getArtifactByVersion = computedFn(
    (artifactId: string, versionId: "original" | "updated") => this.versionHistory.get(artifactId)?.[versionId]
  );

  initArtifacts = async (chatId: string, artifactId: string, data: TArtifact) => {
    this.versionHistory.set(artifactId, {
      original: data,
      updated: undefined,
    });
    this.chatArtifactsMap.set(chatId, [...(this.chatArtifactsMap.get(chatId) || []), artifactId]);
  };

  updateArtifact = (artifactId: string, versionId: "original" | "updated", data: Partial<TUpdatedArtifact>) => {
    runInAction(() => {
      const existingHistory = this.versionHistory.get(artifactId);

      // If artifactId not found, initialize with partial structure
      if (!existingHistory) {
        this.versionHistory.set(artifactId, {
          original: versionId === "original" ? (data as TArtifact) : ({} as TArtifact),
          updated: versionId === "updated" ? (data as TUpdatedArtifact) : ({} as TUpdatedArtifact),
        });
        return;
      }

      // Merge the existing version
      const updatedHistory = {
        ...existingHistory,
        [versionId]: {
          ...existingHistory[versionId],
          ...data,
        },
      };

      // Update the map
      this.versionHistory.set(artifactId, updatedHistory);
    });
  };

  fetchArtifactsByChatId = async (chatId: string) => {
    const response = await this.piChatService.listArtifacts(chatId);
    response.forEach((artifact) => {
      this.initArtifacts(chatId, artifact.artifact_id, artifact);
    });
  };
}
