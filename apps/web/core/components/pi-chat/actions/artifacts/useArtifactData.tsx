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

import { useEffect, useRef } from "react";
import { isEmpty } from "lodash-es";
import type { ICycle, IModule, TIssue, TIssuePriorities, TPage, TProject } from "@plane/types";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TArtifact, TUpdatedArtifact } from "@/types";
import { getRandomCoverImage } from "@/helpers/cover-image.helper";
import { getRandomEmoji } from "@plane/utils";

// --- Hooks per type ---
export const useWorkItemData = (artifactId: string): Partial<TIssue> => {
  const {
    artifactsStore: { getArtifact, getArtifactByVersion },
  } = usePiChat();

  const originalData = getArtifact(artifactId);
  const updatedData = getArtifactByVersion(artifactId, "updated");
  const properties = originalData?.parameters?.properties;
  const projectId = originalData?.parameters?.project?.id;

  return !isEmpty(updatedData as Partial<TIssue>)
    ? (updatedData as Partial<TIssue>)
    : {
        name: originalData?.parameters?.name,
        description_html: originalData?.parameters?.description || "",
        project_id: projectId?.toString() || "",
        state_id: properties?.state?.id || null,
        priority: properties?.priority?.name as TIssuePriorities,
        start_date: properties?.start_date?.name || null,
        target_date: properties?.target_date?.name || null,
        assignee_ids: properties?.assignees?.map((a: { id: string }) => a.id) || [],
        label_ids: properties?.labels?.map((l: { id: string }) => l.id) || [],
        type_id: properties?.type_id?.id || null,
        estimate_point: null,
        parent_id: null,
        cycle_id: null,
        module_ids: null,
      };
};

export const useModuleData = (artifactId: string): Partial<IModule> => {
  const {
    artifactsStore: { getArtifact, getArtifactByVersion },
  } = usePiChat();

  const originalData = getArtifact(artifactId);
  const updatedData = getArtifactByVersion(artifactId, "updated");
  const parameters = originalData?.parameters;
  return !isEmpty(updatedData as Partial<IModule>)
    ? (updatedData as Partial<IModule>)
    : {
        name: parameters?.name,
        description: parameters?.description || "",
        start_date: parameters?.properties?.start_date?.name || null,
        target_date: parameters?.properties?.end_date?.name || null,
        member_ids: [],
        lead_id: null,
        status: "backlog",
      };
};

export const usePageData = (artifactId: string): Partial<TPage> => {
  const {
    artifactsStore: { getArtifact, getArtifactByVersion },
  } = usePiChat();

  const originalData = getArtifact(artifactId);
  const updatedData = getArtifactByVersion(artifactId, "updated");
  const parameters = originalData?.parameters;

  return !isEmpty(updatedData as Partial<TPage>)
    ? (updatedData as Partial<TPage>)
    : {
        name: parameters?.name,
        description_html: parameters?.description || parameters?.description_html || "",
        logo_props: parameters?.logo_props,
      };
};

export const useProjectData = (artifactId: string): Partial<TProject> => {
  const {
    artifactsStore: { getArtifact, getArtifactByVersion, updateArtifact },
  } = usePiChat();

  const originalData = getArtifact(artifactId);
  const updatedData = getArtifactByVersion(artifactId, "updated") as Partial<TProject>;
  const parameters = originalData?.parameters;
  const projectData = !isEmpty(updatedData)
    ? updatedData
    : {
        cover_image_url: parameters?.properties?.cover_image_url?.name,
        description: parameters?.description || "",
        logo_props: parameters?.logo_props,
        identifier: "",
        name: parameters?.name,
      };

  return projectData;
};

export const useTemplateData = (artifactId: string): TArtifact | undefined => {
  const {
    artifactsStore: { getArtifact },
  } = usePiChat();

  return getArtifact(artifactId);
};

export const useCycleData = (artifactId: string): Partial<ICycle> => {
  const {
    artifactsStore: { getArtifact, getArtifactByVersion },
  } = usePiChat();

  const originalData = getArtifact(artifactId);
  const updatedData = getArtifactByVersion(artifactId, "updated");
  const parameters = originalData?.parameters;
  return !isEmpty(updatedData as Partial<ICycle>)
    ? (updatedData as Partial<ICycle>)
    : {
        name: parameters?.name,
        description: parameters?.description || "",
        start_date: parameters?.properties?.start_date?.name || null,
        end_date: parameters?.properties?.end_date?.name || null,
      };
};

export const useArtifactData = (artifactId: string, artifactType?: string): TUpdatedArtifact => {
  const issueData = useWorkItemData(artifactId);
  const templateData = useTemplateData(artifactId);
  const pageData = usePageData(artifactId);
  const projectData = useProjectData(artifactId);
  const cycleData = useCycleData(artifactId);
  const moduleData = useModuleData(artifactId);
  switch (artifactType) {
    case "workitem":
      return issueData;
    case "page":
      return pageData;
    case "epic":
      return issueData;
    case "project":
      return projectData;
    case "cycle":
      return cycleData;
    case "module":
      return moduleData;
    default:
      return templateData;
  }
};
