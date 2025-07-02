import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// Plane-web
import { TInitiativeLink } from "@/plane-web/types/initiative";
//
import { InitiativeStore } from "./initiatives.store";

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

      return response;
    } catch (e) {
      console.log("error while creating initiative Link", e);
      throw e;
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
