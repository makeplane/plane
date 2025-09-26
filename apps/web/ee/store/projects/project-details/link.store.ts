import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { TProjectLink, TProjectLinkMap, TProjectLinkIdMap } from "@plane/types";
// types
import { ProjectService } from "@/plane-web/services";
import { IProjectStore } from "../projects";

export interface IProjectLinkStoreActions {
  addLinks: (projectId: string, links: TProjectLink[]) => void;
  fetchLinks: (workspaceSlug: string, projectId: string) => Promise<TProjectLink[]>;
  createLink: (workspaceSlug: string, projectId: string, data: Partial<TProjectLink>) => Promise<TProjectLink>;
  updateLink: (
    workspaceSlug: string,
    projectId: string,
    linkId: string,
    data: Partial<TProjectLink>
  ) => Promise<TProjectLink>;
  removeLink: (workspaceSlug: string, projectId: string, linkId: string) => Promise<void>;
  setLinkData: (link: TProjectLink | undefined) => void;
  toggleLinkModal: (isOpen: boolean) => void;
}

export interface IProjectLinkStore extends IProjectLinkStoreActions {
  // observables
  links: TProjectLinkIdMap;
  linkMap: TProjectLinkMap;
  linkData: TProjectLink | undefined;
  isLinkModalOpen: boolean;
  // helper methods
  getLinksByProjectId: (projectId: string) => string[] | undefined;
  getLinkById: (linkId: string) => TProjectLink | undefined;
}

export class ProjectLinkStore implements IProjectLinkStore {
  // observables
  links: TProjectLinkIdMap = {};
  linkMap: TProjectLinkMap = {};
  linkData: TProjectLink | undefined = undefined;
  isLinkModalOpen = false;
  // root store
  rootProjectDetailStore: IProjectStore;
  // services
  projectService;

  constructor(rootStore: IProjectStore) {
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
    // root store
    this.rootProjectDetailStore = rootStore;
    // services
    this.projectService = new ProjectService();
  }

  // helper methods
  getLinksByProjectId = (projectId: string) => {
    if (!projectId) return undefined;
    return this.links[projectId] ?? undefined;
  };

  getLinkById = (linkId: string) => {
    if (!linkId) return undefined;
    return this.linkMap[linkId] ?? undefined;
  };

  // actions
  setLinkData = (link: TProjectLink | undefined) => {
    runInAction(() => {
      this.linkData = link;
    });
  };

  toggleLinkModal = (isOpen: boolean) => {
    runInAction(() => {
      this.isLinkModalOpen = isOpen;
    });
  };

  addLinks = (projectId: string, links: TProjectLink[]) => {
    runInAction(() => {
      this.links[projectId] = links.map((link) => link.id);
      links.forEach((link) => set(this.linkMap, link.id, link));
    });
  };

  fetchLinks = async (workspaceSlug: string, projectId: string) => {
    const response = await this.projectService.fetchProjectLinks(workspaceSlug, projectId);
    this.addLinks(projectId, response);
    return response;
  };

  createLink = async (workspaceSlug: string, projectId: string, data: Partial<TProjectLink>) => {
    const response = await this.projectService.createProjectLink(workspaceSlug, projectId, data);
    // const issueLinkCount = this.getLinksByProjectId(projectId)?.length ?? 0;
    runInAction(() => {
      this.links[projectId] = [response.id, ...this.links[projectId]];
      set(this.linkMap, response.id, response);
    });
    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  updateLink = async (workspaceSlug: string, projectId: string, linkId: string, data: Partial<TProjectLink>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.linkMap, [linkId, key], data[key as keyof TProjectLink]);
      });
    });

    const response = await this.projectService.updateProjectLink(workspaceSlug, projectId, linkId, data);

    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeLink = async (workspaceSlug: string, projectId: string, linkId: string) => {
    // const issueLinkCount = this.getLinksByProjectId(projectId)?.length ?? 0;
    await this.projectService.deleteProjectLink(workspaceSlug, projectId, linkId);

    const linkIndex = this.links[projectId].findIndex((_comment) => _comment === linkId);
    if (linkIndex >= 0)
      runInAction(() => {
        this.links[projectId].splice(linkIndex, 1);
        delete this.linkMap[linkId];
      });

    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId);
  };
}
