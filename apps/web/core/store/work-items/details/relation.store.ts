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

import { uniq, get, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueRelationIdMap, TIssueRelationMap, TIssueRelation, TIssue } from "@plane/types";
// components
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
import { parseRelationKey } from "@/components/relations";
// Plane-web
import { DEPENDENCY_RELATION_KEYS, REVERSE_RELATIONS } from "@/constants/timeline";
import type { TIssueRelationTypes } from "@/types";
// services
import { WorkItemDependencyService } from "@/services/issue/work-item-dependency.service";
import { WorkItemRelationService } from "@/services/issue/work-item-relation.service";
// types
import type { IIssueDetail } from "./root.store";
export interface IIssueRelationStoreActions {
  // actions
  fetchRelations: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueRelation>;
  createRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: string,
    issues: string[]
  ) => Promise<TIssue[]>;
  removeRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: string,
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
    ISSUE_RELATION_OPTIONS: Record<string, TRelationObject | undefined>
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
  dependencyService;
  relationService;

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
    this.dependencyService = new WorkItemDependencyService();
    this.relationService = new WorkItemRelationService();
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
    (issueId: string, ISSUE_RELATION_OPTIONS: Record<string, TRelationObject | undefined>) => {
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

  /**
   * Build a lookup map: directionName → compositeKey
   * e.g., "relates to" → "abc123::relates to"
   */
  private buildNameToCompositeKeyMap(): Record<string, string> {
    const definitions = this.rootIssueDetailStore.rootIssueStore.rootStore.relationDefinition.sortedRelationDefinitions;
    const nameMap: Record<string, string> = {};
    for (const def of definitions) {
      // Guard against name collisions — first definition wins
      if (!nameMap[def.outward]) nameMap[def.outward] = `${def.id}::${def.outward}`;
      if (!nameMap[def.inward]) nameMap[def.inward] = `${def.id}::${def.inward}`;
    }
    return nameMap;
  }

  // actions
  fetchRelations = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const [depResult, relResult] = await Promise.allSettled([
      this.dependencyService.list(workspaceSlug, projectId, issueId),
      this.relationService.list(workspaceSlug, projectId, issueId),
    ]);

    const dependencyResponse: TIssueRelation = depResult.status === "fulfilled" ? depResult.value : {};
    const relationResponse: TIssueRelation = relResult.status === "fulfilled" ? relResult.value : {};

    // Transform relation response keys from plain names to composite "uuid::name" keys
    const nameToKey = this.buildNameToCompositeKeyMap();
    const transformedRelations: TIssueRelation = {};
    for (const [apiKey, issues] of Object.entries(relationResponse)) {
      const compositeKey = nameToKey[apiKey];
      if (compositeKey) {
        transformedRelations[compositeKey] = issues;
      }
      // Keys not found in definitions are skipped (e.g., dependency types
      // returned by the relations endpoint — already covered by dependency endpoint)
    }

    const merged = { ...dependencyResponse, ...transformedRelations };

    runInAction(() => {
      Object.keys(merged).forEach((key) => {
        const relation_issues = merged[key];
        const issues = relation_issues.flat().map((issue) => issue);
        if (issues && issues.length > 0) this.rootIssueDetailStore.rootIssueStore.issues.addIssue(issues);
        set(this.relationMap, [issueId, key], issues && issues.length > 0 ? issues.map((issue) => issue.id) : []);
      });
    });

    return merged;
  };

  createRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: string,
    issues: string[]
  ) => {
    let response: TIssue[];

    if (DEPENDENCY_RELATION_KEYS.has(relationType)) {
      // Dependency — use dependency service
      response = await this.dependencyService.create(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        work_item_ids: issues,
      });
    } else {
      // Custom relation — relationType is "definitionId::directionName"
      const parsed = parseRelationKey(relationType);
      if (!parsed) throw { error: `Invalid relation key: ${relationType}` };

      response = await this.relationService.create(workspaceSlug, projectId, issueId, {
        relation_definition_id: parsed.definitionId,
        relation_definition_type: parsed.directionName,
        work_item_ids: issues,
      });
    }

    const issuesOfRelation = get(this.relationMap, [issueId, relationType]) ?? [];

    if (response && response.length > 0)
      runInAction(() => {
        response.forEach((issue) => {
          this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue]);
          issuesOfRelation.push(issue.id);

          // For dependencies, manage reverse relation client-side
          if (DEPENDENCY_RELATION_KEYS.has(relationType)) {
            const reverseRelatedType = REVERSE_RELATIONS[relationType as TIssueRelationTypes];
            const issuesOfRelated = get(this.relationMap, [issue.id, reverseRelatedType]);
            if (!issuesOfRelated) {
              set(this.relationMap, [issue.id, reverseRelatedType], [issueId]);
            } else {
              set(this.relationMap, [issue.id, reverseRelatedType], uniq([...issuesOfRelated, issueId]));
            }
          }
        });
        set(this.relationMap, [issueId, relationType], uniq(issuesOfRelation));
      });

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
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

      // perform API call — timeline drag always creates dependencies
      await this.dependencyService.create(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        work_item_ids: [relatedIssueId],
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
    relationType: string,
    related_issue: string,
    updateLocally = false
  ) => {
    try {
      // Optimistic local removal
      const relationIndex = this.relationMap[issueId]?.[relationType]?.findIndex(
        (_issueId: string) => _issueId === related_issue
      );
      if (relationIndex !== undefined && relationIndex >= 0)
        runInAction(() => {
          this.relationMap[issueId]?.[relationType]?.splice(relationIndex, 1);
        });

      // API call — route to correct service
      if (!updateLocally) {
        if (DEPENDENCY_RELATION_KEYS.has(relationType)) {
          await this.dependencyService.remove(workspaceSlug, projectId, issueId, {
            work_item_id: related_issue,
          });
        } else {
          await this.relationService.remove(workspaceSlug, projectId, issueId, {
            work_item_id: related_issue,
          });
        }
      }

      // For dependencies, also remove reverse relation client-side.
      // Custom relations don't need client-side reverse management —
      // the backend handles bidirectionality. Error recovery via
      // fetchRelations refreshes the current issue's full relation state.
      if (DEPENDENCY_RELATION_KEYS.has(relationType)) {
        const reverseRelatedType = REVERSE_RELATIONS[relationType as TIssueRelationTypes];
        const relatedIndex = this.relationMap[related_issue]?.[reverseRelatedType]?.findIndex(
          (_issueId) => _issueId === issueId
        );
        if (relatedIndex !== undefined && relatedIndex >= 0)
          runInAction(() => {
            this.relationMap[related_issue]?.[reverseRelatedType]?.splice(relatedIndex, 1);
          });
      }

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
              // Skip custom relation types — they use composite keys
              // and will be properly loaded via fetchRelations
              if (!REVERSE_RELATIONS[relation_type as TIssueRelationTypes]) continue;

              if (issueRelations[relation_type]) issueRelations[relation_type]?.push(id);
              else issueRelations[relation_type] = [id];
            }
          }

          if (issue_related && Array.isArray(issue_related) && issue_related.length) {
            for (const relation of issue_related) {
              const { relation_type, id } = relation;

              if (!relation_type) continue;

              const reverseRelatedType = REVERSE_RELATIONS[relation_type as TIssueRelationTypes];
              // Skip custom relation types — they aren't in REVERSE_RELATIONS
              // and will be properly loaded via fetchRelations
              if (!reverseRelatedType) continue;

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
