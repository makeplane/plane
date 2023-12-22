import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { IIssueLink, ILinkDetails } from "types";

export interface IIssueLinkStoreActions {
  createLink: (workspaceSlug: string, projectId: string, issueId: string, data: IIssueLink) => Promise<any>;
  updateLink: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: IIssueLink
  ) => Promise<any>;
  removeLink: (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => Promise<any>;
}

export interface IIssueLinkStore extends IIssueLinkStoreActions {
  // observables
  links: Record<string, string[]>; // Record defines issueId as key and  LinkId's as value
  linkMap: Record<string, ILinkDetails>; // Record defines LinkId as key and link as value
  // computed
  issueLinks: string[] | undefined;
  // helper methods
  getLinksByIssueId: (issueId: string) => string[] | undefined;
  getLinkById: (linkId: string) => ILinkDetails | undefined;
}

export class IssueLinkStore implements IIssueLinkStore {
  // observables
  links: Record<string, string[]> = {};
  linkMap: Record<string, ILinkDetails> = {};
  // root store
  rootIssueDetail: IIssueDetail;
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
      createLink: action,
      updateLink: action,
      removeLink: action,
    });
    // root store
    this.rootIssueDetail = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // computed
  get issueLinks() {
    const issueId = this.rootIssueDetail.issueId;
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

  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: IIssueLink) => {
    try {
      const response = await this.issueService.createIssueLink(workspaceSlug, projectId, issueId, data);

      runInAction(() => {
        this.links[issueId].push(response.id);
        set(this.linkMap, response.id, response);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string, data: IIssueLink) => {
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.linkMap, [linkId, key], data[key as keyof IIssueLink]);
        });
      });

      const response = await this.issueService.updateIssueLink(workspaceSlug, projectId, issueId, linkId, data);

      return response;
    } catch (error) {
      // TODO: fetch issue detail
      throw error;
    }
  };

  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) => {
    try {
      const response = await this.issueService.deleteIssueLink(workspaceSlug, projectId, issueId, linkId);

      const reactionIndex = this.links[issueId].findIndex((_comment) => _comment === linkId);
      if (reactionIndex >= 0)
        runInAction(() => {
          this.links[issueId].splice(reactionIndex, 1);
          delete this.linkMap[linkId];
        });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
