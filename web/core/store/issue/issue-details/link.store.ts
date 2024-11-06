import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// services
import { TIssueLink, TIssueLinkMap, TIssueLinkIdMap } from "@plane/types";
import { IssueService } from "@/services/issue";
// types
import { IIssueDetail } from "./root.store";

export interface IIssueLinkStoreActions {
  addLinks: (issueId: string, links: TIssueLink[]) => void;
  fetchLinks: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueLink[]>;
  createLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueLink>
  ) => Promise<TIssueLink>;
  updateLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => Promise<TIssueLink>;
  removeLink: (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => Promise<void>;
}

export interface IIssueLinkStore extends IIssueLinkStoreActions {
  // observables
  links: TIssueLinkIdMap;
  linkMap: TIssueLinkMap;
  // computed
  issueLinks: string[] | undefined;
  // helper methods
  getLinksByIssueId: (issueId: string) => string[] | undefined;
  getLinkById: (linkId: string) => TIssueLink | undefined;
}

export class IssueLinkStore implements IIssueLinkStore {
  // observables
  links: TIssueLinkIdMap = {};
  linkMap: TIssueLinkMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      links: observable,
      linkMap: observable,
      // computed
      issueLinks: computed,
      // actions
      addLinks: action.bound,
      fetchLinks: action,
      createLink: action,
      updateLink: action,
      removeLink: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // computed
  get issueLinks() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.links[issueId] ?? undefined;
  }

  // helper methods
  getLinksByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.links[issueId] ?? undefined;
  };

  getLinkById = (linkId: string) => {
    if (!linkId) return undefined;
    return this.linkMap[linkId] ?? undefined;
  };

  // actions
  addLinks = (issueId: string, links: TIssueLink[]) => {
    runInAction(() => {
      this.links[issueId] = links.map((link) => link.id);
      links.forEach((link) => set(this.linkMap, link.id, link));
    });
  };

  fetchLinks = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchIssueLinks(workspaceSlug, projectId, issueId);
    this.addLinks(issueId, response);
    return response;
  };

  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueLink>) => {
    const response = await this.issueService.createIssueLink(workspaceSlug, projectId, issueId, data);
    const issueLinkCount = this.getLinksByIssueId(issueId)?.length ?? 0;
    runInAction(() => {
      this.links[issueId].push(response.id);
      set(this.linkMap, response.id, response);
      this.rootIssueDetailStore.rootIssueStore.issues.updateIssue(issueId, {
        link_count: issueLinkCount + 1, // increment link count
      });
    });
    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  updateLink = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.linkMap, [linkId, key], data[key as keyof TIssueLink]);
      });
    });

    const response = await this.issueService.updateIssueLink(workspaceSlug, projectId, issueId, linkId, data);

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => {
    const issueLinkCount = this.getLinksByIssueId(issueId)?.length ?? 0;
    await this.issueService.deleteIssueLink(workspaceSlug, projectId, issueId, linkId);

    const linkIndex = this.links[issueId].findIndex((_comment) => _comment === linkId);
    if (linkIndex >= 0)
      runInAction(() => {
        this.links[issueId].splice(linkIndex, 1);
        delete this.linkMap[linkId];
        this.rootIssueDetailStore.rootIssueStore.issues.updateIssue(issueId, {
          link_count: issueLinkCount - 1, // decrement link count
        });
      });

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
