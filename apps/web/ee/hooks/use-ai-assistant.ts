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

import { formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useModule } from "@/hooks/store/use-module";
import { useProjectView } from "@/hooks/store/use-project-view";
import { EPageStoreType, usePageStore, useTeamspaces } from "./store";
import { useInitiatives } from "./store/use-initiatives";

type TEntityType =
  | "issue"
  | "cycle"
  | "module"
  | "view"
  | "teamspace"
  | "project_page"
  | "teamspace_page"
  | "wiki"
  | "initiative";

const getEntityData = (
  params: Record<string, string | undefined>
): {
  entityType: TEntityType;
  entityIdentifier: string;
} | null => {
  const { workItem, cycleId, moduleId, pageId, viewId, projectId, teamspaceId, initiativeId } = params;
  if (workItem)
    return {
      entityType: "issue",
      entityIdentifier: workItem,
    };
  if (cycleId)
    return {
      entityType: "cycle",
      entityIdentifier: cycleId,
    };
  if (moduleId)
    return {
      entityType: "module",
      entityIdentifier: moduleId,
    };
  if (pageId) {
    if (projectId)
      return {
        entityType: "project_page",
        entityIdentifier: pageId,
      };
    if (teamspaceId)
      return {
        entityType: "teamspace_page",
        entityIdentifier: pageId,
      };
    return {
      entityType: "wiki",
      entityIdentifier: pageId,
    };
  }
  if (initiativeId)
    return {
      entityType: "initiative",
      entityIdentifier: initiativeId,
    };
  if (teamspaceId)
    return {
      entityType: "teamspace",
      entityIdentifier: teamspaceId,
    };
  if (viewId)
    return {
      entityType: "view",
      entityIdentifier: viewId,
    };
  return null;
};
export const useAIAssistant = (params: Record<string, string | undefined>) => {
  const entityData = getEntityData(params);
  const { getCycleById } = useCycle();
  const { getModuleById } = useModule();
  const { getPageById } = usePageStore(
    entityData?.entityType === "project_page"
      ? EPageStoreType.PROJECT
      : entityData?.entityType === "teamspace_page"
        ? EPageStoreType.TEAMSPACE
        : EPageStoreType.WORKSPACE
  );
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  const { getTeamspaceById } = useTeamspaces();
  const { getViewById } = useProjectView();
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  if (!entityData) return null;
  const { entityType, entityIdentifier } = entityData;
  switch (entityType) {
    case "issue": {
      const [projectIdentifier, sequence_id] = entityIdentifier.split("-");
      const issueId = getIssueIdByIdentifier(entityIdentifier);
      const issue = issueId ? getIssueById(issueId) : undefined;
      if (!issue) return null;
      return {
        id: issue.id,
        type: "issues",
        title: issue.name,
        subTitle: formatProjectWorkItemIdentifierForDisplay(projectIdentifier, sequence_id),
      };
    }
    case "cycle": {
      const cycle = getCycleById(entityIdentifier);
      if (!cycle) return null;
      return {
        id: entityIdentifier,
        type: "cycles",
        title: cycle.name,
      };
    }
    case "module": {
      const moduleDetails = getModuleById(entityIdentifier);
      if (!moduleDetails) return null;
      return {
        id: entityIdentifier,
        type: "modules",
        title: moduleDetails.name,
      };
    }
    case "project_page":
    case "teamspace_page":
    case "wiki": {
      const pageDetails = getPageById(entityIdentifier);
      if (!pageDetails) return null;
      return {
        id: entityIdentifier,
        type: "pages",
        title: pageDetails.name,
      };
    }
    case "teamspace": {
      const teamspaceDetails = getTeamspaceById(entityIdentifier);
      if (!teamspaceDetails) return null;
      return {
        id: entityIdentifier,
        type: "teamspaces",
        title: teamspaceDetails.name,
      };
    }
    case "initiative": {
      const initiativeDetails = getInitiativeById(entityIdentifier);
      if (!initiativeDetails) return null;
      return {
        id: entityIdentifier,
        type: "initiatives",
        title: initiativeDetails.name,
      };
    }
    case "view": {
      const viewDetails = getViewById(entityIdentifier);
      if (!viewDetails) return null;
      return {
        id: entityIdentifier,
        type: "views",
        title: viewDetails.name,
      };
    }
  }
};
