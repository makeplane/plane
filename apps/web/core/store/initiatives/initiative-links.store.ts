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
import { computedFn } from "mobx-utils";
// Plane-web
import type { TInitiativeLink } from "@/types/initiative";
//
import type { InitiativeStore } from "./initiatives.store";

export interface IInitiativeLinkStore {
  initiativeLinksMap: Record<string, TInitiativeLink[]>;

  linkData: TInitiativeLink | null;
  isLinkModalOpen: boolean;
  setLinkData: (initiativeLInk: TInitiativeLink | null) => void;
  setIsLinkModalOpen: (isOpen: boolean) => void;

  getInitiativeLinks: (initiativeId: string) => TInitiativeLink[] | undefined;

  fetchInitiativeLinks: (workspaceSlug: string, initiativeId: string) => Promise<TInitiativeLink[]>;
  createInitiativeLink: (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeLink>
  ) => Promise<TInitiativeLink>;
  updateInitiativeLink: (
    workspaceSlug: string,
    initiativeId: string,
    linkId: string,
    payload: Partial<TInitiativeLink>
  ) => Promise<void>;
  deleteInitiativeLink: (workspaceSlug: string, initiativeId: string, linkId: string) => Promise<void>;
}

export class InitiativeLinkStore implements IInitiativeLinkStore {
  initiativeLinksMap: Record<string, TInitiativeLink[]> = {};
  linkData: TInitiativeLink | null = null;
  isLinkModalOpen: boolean = false;

  initiativeStore: InitiativeStore;

  constructor(_initiativeStore: InitiativeStore) {
    makeObservable(this, {
      // observables
      initiativeLinksMap: observable,
      linkData: observable,
      isLinkModalOpen: observable.ref,
      // actions
      getInitiativeLinks: action,
      createInitiativeLink: action,
      updateInitiativeLink: action,
      deleteInitiativeLink: action,
      setLinkData: action,
      setIsLinkModalOpen: action,
    });

    this.initiativeStore = _initiativeStore;
  }

  getInitiativeLinks = computedFn((initiativeId: string) => this.initiativeLinksMap[initiativeId]);

  fetchInitiativeLinks = async (workspaceSlug: string, initiativeId: string): Promise<TInitiativeLink[]> => {
    try {
      const response = await this.initiativeStore.initiativeService.getInitiativeLinks(workspaceSlug, initiativeId);

      runInAction(() => {
        this.initiativeLinksMap[initiativeId] = response;
      });

      return response;
    } catch (e) {
      console.log("error while fetching initiativeLinks", e);
      throw e;
    }
  };

  createInitiativeLink = async (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeLink>
  ): Promise<TInitiativeLink> => {
    try {
      const response = await this.initiativeStore.initiativeService.createInitiativeLink(
        workspaceSlug,
        initiativeId,
        payload
      );

      runInAction(() => {
        if (!this.initiativeLinksMap[initiativeId] || !Array.isArray(this.initiativeLinksMap[initiativeId]))
          this.initiativeLinksMap[initiativeId] = [];
        this.initiativeLinksMap[initiativeId].push(response);
      });

      this._scheduleRefreshLinks(workspaceSlug, initiativeId, 200);

      return response;
    } catch (e) {
      console.log("error while creating initiative Link", e);
      throw e;
    }
  };

  /**
   * Schedules a background refresh of initiative links to asynchronously update link metadata.
   * @param workspaceSlug - The slug of the workspace
   * @param initiativeId - The id of the initiative
   * @param duration - The duration to wait before running the task
   * @returns void
   */
  _scheduleRefreshLinks = async (workspaceSlug: string, initiativeId: string, duration: number) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, duration));

      const updatedLinks = await this.initiativeStore.initiativeService.getInitiativeLinks(workspaceSlug, initiativeId);

      runInAction(() => {
        this.initiativeLinksMap[initiativeId] = updatedLinks;
      });
    } catch (error) {
      console.error("error while refreshing initiative links for metadata", error);
    }
  };

  updateInitiativeLink = async (
    workspaceSlug: string,
    initiativeId: string,
    linkId: string,
    payload: Partial<TInitiativeLink>
  ): Promise<void> => {
    try {
      await this.initiativeStore.initiativeService.updateInitiativeLink(workspaceSlug, initiativeId, linkId, payload);

      runInAction(() => {
        if (!this.initiativeLinksMap[initiativeId] || !Array.isArray(this.initiativeLinksMap[initiativeId])) return;

        const initiativeLinkIndex = this.initiativeLinksMap[initiativeId].findIndex(
          (initiativeLink) => initiativeLink.id === linkId
        );

        if (initiativeLinkIndex < 0) return;

        const initiativeLink = this.initiativeLinksMap[initiativeId][initiativeLinkIndex];

        this.initiativeLinksMap[initiativeId][initiativeLinkIndex] = { ...initiativeLink, ...payload };
      });
    } catch (e) {
      console.log("error while updating initiative Link", e);
      throw e;
    }
  };

  deleteInitiativeLink = async (workspaceSlug: string, initiativeId: string, linkId: string): Promise<void> => {
    try {
      await this.initiativeStore.initiativeService.deleteInitiativeLink(workspaceSlug, initiativeId, linkId);

      const linkIndex = this.initiativeLinksMap[initiativeId].findIndex((_comment) => _comment.id === linkId);

      runInAction(() => {
        this.initiativeLinksMap[initiativeId].splice(linkIndex, 1);
        delete this.initiativeLinksMap[linkId];
      });
    } catch (e) {
      console.log("error while updating initiative Link", e);
      throw e;
    }
  };

  setLinkData = (initiativeLink: TInitiativeLink | null) => {
    runInAction(() => {
      this.linkData = initiativeLink;
    });
  };

  setIsLinkModalOpen = (isOpen: boolean) => {
    runInAction(() => {
      this.isLinkModalOpen = isOpen;
    });
  };
}
