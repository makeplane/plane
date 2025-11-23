import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// types
import type { TLink, TLinkIdMap, TLinkMap } from "@plane/types";
// services
import { WorkspaceService } from "@/plane-web/services";

export interface IWorkspaceLinkStoreActions {
  addLinks: (projectId: string, links: TLink[]) => void;
  fetchLinks: (workspaceSlug: string) => Promise<TLink[]>;
  createLink: (workspaceSlug: string, data: Partial<TLink>) => Promise<TLink>;
  updateLink: (workspaceSlug: string, linkId: string, data: Partial<TLink>) => Promise<TLink>;
  removeLink: (workspaceSlug: string, linkId: string) => Promise<void>;
  setLinkData: (link: TLink | undefined) => void;
  toggleLinkModal: (isOpen: boolean) => void;
}

export interface IWorkspaceLinkStore extends IWorkspaceLinkStoreActions {
  // observables
  links: TLinkIdMap;
  linkMap: TLinkMap;
  linkData: TLink | undefined;
  isLinkModalOpen: boolean;
  // helper methods
  getLinksByWorkspaceId: (projectId: string) => string[] | undefined;
  getLinkById: (linkId: string) => TLink | undefined;
}

export class WorkspaceLinkStore implements IWorkspaceLinkStore {
  // observables
  links: TLinkIdMap = {};
  linkMap: TLinkMap = {};
  linkData: TLink | undefined = undefined;
  isLinkModalOpen = false;
  // services
  workspaceService: WorkspaceService;

  constructor() {
    makeObservable(this, {
      // observables
      links: observable,
      linkMap: observable,
      linkData: observable,
      isLinkModalOpen: observable,
      // actions
      addLinks: action.bound,
      fetchLinks: action,
      createLink: action,
      updateLink: action,
      removeLink: action,
      setLinkData: action,
      toggleLinkModal: action,
    });
    // services
    this.workspaceService = new WorkspaceService();
  }

  // helper methods
  getLinksByWorkspaceId = (projectId: string) => {
    if (!projectId) return undefined;
    return this.links[projectId] ?? undefined;
  };

  getLinkById = (linkId: string) => {
    if (!linkId) return undefined;
    return this.linkMap[linkId] ?? undefined;
  };

  // actions
  setLinkData = (link: TLink | undefined) => {
    runInAction(() => {
      this.linkData = link;
    });
  };

  toggleLinkModal = (isOpen: boolean) => {
    runInAction(() => {
      this.isLinkModalOpen = isOpen;
    });
  };

  addLinks = (workspaceSlug: string, links: TLink[]) => {
    runInAction(() => {
      this.links[workspaceSlug] = links.map((link) => link.id);
      links.forEach((link) => set(this.linkMap, link.id, link));
    });
  };

  fetchLinks = async (workspaceSlug: string) => {
    const response = await this.workspaceService.fetchWorkspaceLinks(workspaceSlug);
    this.addLinks(workspaceSlug, response);
    return response;
  };

  createLink = async (workspaceSlug: string, data: Partial<TLink>) => {
    const response = await this.workspaceService.createWorkspaceLink(workspaceSlug, data);

    runInAction(() => {
      this.links[workspaceSlug] = [response.id, ...(this.links[workspaceSlug] ?? [])];
      set(this.linkMap, response.id, response);
    });
    return response;
  };

  updateLink = async (workspaceSlug: string, linkId: string, data: Partial<TLink>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.linkMap, [linkId, key], data[key as keyof TLink]);
      });
    });

    const response = await this.workspaceService.updateWorkspaceLink(workspaceSlug, linkId, data);
    return response;
  };

  removeLink = async (workspaceSlug: string, linkId: string) => {
    // const issueLinkCount = this.getLinksByWorkspaceId(projectId)?.length ?? 0;
    await this.workspaceService.deleteWorkspaceLink(workspaceSlug, linkId);

    const linkIndex = this.links[workspaceSlug].findIndex((link) => link === linkId);
    if (linkIndex >= 0)
      runInAction(() => {
        this.links[workspaceSlug].splice(linkIndex, 1);
        delete this.linkMap[linkId];
      });
  };
}
