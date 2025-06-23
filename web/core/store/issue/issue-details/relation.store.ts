import get from "lodash/get";
import set from "lodash/set";
import uniq from "lodash/uniq";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// Plane
import { TIssueRelationIdMap, TIssueRelationMap, TIssueRelation, TIssue } from "@plane/types";
// components
import { TRelationObject } from "@/components/issues";
// Plane-web
import { REVERSE_RELATIONS } from "@/plane-web/constants";
import { TIssueRelationTypes } from "@/plane-web/types";
// services
import { IssueRelationService } from "@/services/issue";
// types
import { IIssueDetail } from "./root.store";
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
    related_issue: string,
    updateLocally?: boolean
  ) => Promise<void>;
}

export interface IIssueRelationStore extends IIssueRelationStoreActions {
  // observables
  relationMap: TIssueRelationMap; // Record defines relationType as key and reactions as value
  // computed
  issueRelations: TIssueRelationIdMap | undefined;
  // helper methods
  getRelationsByIssueId: (issueId: string) => TIssueRelationIdMap | undefined;
  getRelationCountByIssueId: (
    issueId: string,
    ISSUE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject }
  ) => number;
  getRelationByIssueIdRelationType: (issueId: string, relationType: TIssueRelationTypes) => string[] | undefined;
  extractRelationsFromIssues: (issues: TIssue[]) => void;
  createCurrentRelation: (issueId: string, relationType: TIssueRelationTypes, relatedIssueId: string) => Promise<void>;
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
      createCurrentRelation: action,
      removeRelation: action,
      extractRelationsFromIssues: action,
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

  getRelationCountByIssueId = computedFn(
    (issueId: string, ISSUE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject }) => {
      const issueRelations = this.getRelationsByIssueId(issueId);

      const issueRelationKeys = (Object.keys(issueRelations ?? {}) as TIssueRelationTypes[]).filter(
        (relationKey) => !!ISSUE_RELATION_OPTIONS[relationKey]
      );

      return issueRelationKeys.reduce((acc, curr) => acc + (issueRelations?.[curr]?.length ?? 0), 0);
    }
  );

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

      const reverseRelatedType = REVERSE_RELATIONS[relationType];

      const issuesOfRelation = get(this.relationMap, [issueId, relationType]) ?? [];

      if (response && response.length > 0)
        runInAction(() => {
          response.forEach((issue) => {
            const issuesOfRelated = get(this.relationMap, [issue.id, reverseRelatedType]);
            this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue]);
            issuesOfRelation.push(issue.id);

            if (!issuesOfRelated) {
              set(this.relationMap, [issue.id, reverseRelatedType], [issueId]);
            } else {
              set(this.relationMap, [issue.id, reverseRelatedType], uniq([...issuesOfRelated, issueId]));
            }
          });
          set(this.relationMap, [issueId, relationType], uniq(issuesOfRelation));
        });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * create Relation in current project optimistically
   * @param issueId
   * @param relationType
   * @param relatedIssueId
   * @returns
   */
  createCurrentRelation = async (issueId: string, relationType: TIssueRelationTypes, relatedIssueId: string) => {
    const workspaceSlug = this.rootIssueDetailStore.rootIssueStore.workspaceSlug;
    const projectId = this.rootIssueDetailStore.issue.getIssueById(issueId)?.project_id;

    if (!workspaceSlug || !projectId) return;

    const reverseRelatedType = REVERSE_RELATIONS[relationType];

    const issuesOfRelation = get(this.relationMap, [issueId, relationType]);
    const issuesOfRelated = get(this.relationMap, [relatedIssueId, reverseRelatedType]);

    try {
      // update relations before API call
      runInAction(() => {
        if (!issuesOfRelation) {
          set(this.relationMap, [issueId, relationType], [relatedIssueId]);
        } else {
          set(this.relationMap, [issueId, relationType], uniq([...issuesOfRelation, relatedIssueId]));
        }

        if (!issuesOfRelated) {
          set(this.relationMap, [relatedIssueId, reverseRelatedType], [issueId]);
        } else {
          set(this.relationMap, [relatedIssueId, reverseRelatedType], uniq([...issuesOfRelated, issueId]));
        }
      });

      // perform API call
      await this.issueRelationService.createIssueRelations(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        issues: [relatedIssueId],
      });
    } catch (e) {
      // Revert back store changes if API fails
      runInAction(() => {
        if (issuesOfRelation) {
          set(this.relationMap, [issueId, relationType], issuesOfRelation);
        }

        if (issuesOfRelated) {
          set(this.relationMap, [relatedIssueId, reverseRelatedType], issuesOfRelated);
        }
      });

      throw e;
    }
  };

  removeRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    related_issue: string,
    updateLocally = false
  ) => {
    try {
      const relationIndex = this.relationMap[issueId]?.[relationType]?.findIndex(
        (_issueId) => _issueId === related_issue
      );
      if (relationIndex >= 0)
        runInAction(() => {
          this.relationMap[issueId]?.[relationType]?.splice(relationIndex, 1);
        });

      if (!updateLocally) {
        await this.issueRelationService.deleteIssueRelation(workspaceSlug, projectId, issueId, {
          relation_type: relationType,
          related_issue,
        });
      }

      // While removing one relation, reverse of the relation should also be removed
      const reverseRelatedType = REVERSE_RELATIONS[relationType];
      const relatedIndex = this.relationMap[related_issue]?.[reverseRelatedType]?.findIndex(
        (_issueId) => _issueId === related_issue
      );
      if (relationIndex >= 0)
        runInAction(() => {
          this.relationMap[related_issue]?.[reverseRelatedType]?.splice(relatedIndex, 1);
        });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    } catch (error) {
      this.fetchRelations(workspaceSlug, projectId, issueId);
      throw error;
    }
  };

  /**
   * Extract Relation from the issue Array objects and store it in this Store
   * @param issues
   */
  extractRelationsFromIssues = (issues: TIssue[]) => {
    try {
      runInAction(() => {
        for (const issue of issues) {
          const { issue_relation, issue_related, id: issueId } = issue;

          const issueRelations: { [key in TIssueRelationTypes]?: string[] } = {};

          if (issue_relation && Array.isArray(issue_relation) && issue_relation.length) {
            for (const relation of issue_relation) {
              const { relation_type, id } = relation;

              if (!relation_type) continue;

              if (issueRelations[relation_type]) issueRelations[relation_type]?.push(id);
              else issueRelations[relation_type] = [id];
            }
          }

          if (issue_related && Array.isArray(issue_related) && issue_related.length) {
            for (const relation of issue_related) {
              const { relation_type, id } = relation;

              if (!relation_type) continue;

              const reverseRelatedType = REVERSE_RELATIONS[relation_type as TIssueRelationTypes];

              if (issueRelations[reverseRelatedType]) issueRelations[reverseRelatedType]?.push(id);
              else issueRelations[reverseRelatedType] = [id];
            }
          }

          set(this.relationMap, [issueId], issueRelations);
        }
      });
    } catch (e) {
      console.error("Error while extracting issue relations from issues");
    }
  };
}
