import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueRelationService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueRelationIdMap, TIssueRelationMap, TIssueRelationTypes, TIssueRelation, TIssue } from "@plane/types";

export interface IIssueRelationStoreActions {
  // actions
  fetchRelations: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueRelation>;
  createRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    issues: string[]
  ) => Promise<TIssue[]>;
  removeRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    related_issue: string
  ) => Promise<any>;
}

export interface IIssueRelationStore extends IIssueRelationStoreActions {
  // observables
  relationMap: TIssueRelationMap; // Record defines relationType as key and reactions as value
  // computed
  issueRelations: TIssueRelationIdMap | undefined;
  // helper methods
  getRelationsByIssueId: (issueId: string) => TIssueRelationIdMap | undefined;
  getRelationByIssueIdRelationType: (issueId: string, relationType: TIssueRelationTypes) => string[] | undefined;
}

export class IssueRelationStore implements IIssueRelationStore {
  // observables
  relationMap: TIssueRelationMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueRelationService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      relationMap: observable,
      // computed
      issueRelations: computed,
      // actions
      fetchRelations: action,
      createRelation: action,
      removeRelation: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueRelationService = new IssueRelationService();
  }

  // computed
  get issueRelations() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.relationMap?.[issueId] ?? undefined;
  }

  // // helper methods
  getRelationsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.relationMap?.[issueId] ?? undefined;
  };

  getRelationByIssueIdRelationType = (issueId: string, relationType: TIssueRelationTypes) => {
    if (!issueId || !relationType) return undefined;
    return this.relationMap?.[issueId]?.[relationType] ?? undefined;
  };

  // actions
  fetchRelations = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueRelationService.listIssueRelations(workspaceSlug, projectId, issueId);

      runInAction(() => {
        Object.keys(response).forEach((key) => {
          const relation_key = key as TIssueRelationTypes;
          const relation_issues = response[relation_key];
          const issues = relation_issues.flat().map((issue) => issue);
          if (issues && issues.length > 0) this.rootIssueDetailStore.rootIssueStore.issues.addIssue(issues);
          set(
            this.relationMap,
            [issueId, relation_key],
            issues && issues.length > 0 ? issues.map((issue) => issue.id) : []
          );
        });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  createRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    issues: string[]
  ) => {
    try {
      const response = await this.issueRelationService.createIssueRelations(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        issues,
      });

      if (response && response.length > 0)
        runInAction(() => {
          response.forEach((issue) => {
            this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue]);
            this.relationMap[issueId][relationType].push(issue.id);
          });
        });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  removeRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    related_issue: string
  ) => {
    try {
      const relationIndex = this.relationMap[issueId][relationType].findIndex((_issueId) => _issueId === related_issue);
      if (relationIndex >= 0)
        runInAction(() => {
          this.relationMap[issueId][relationType].splice(relationIndex, 1);
        });

      const response = await this.issueRelationService.deleteIssueRelation(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        related_issue,
      });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      this.fetchRelations(workspaceSlug, projectId, issueId);
      throw error;
    }
  };
}
