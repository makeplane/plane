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

import { useMemo } from "react";
import useSWR from "swr";
// types
import type { TDeDupeIssue } from "@plane/types";
// helpers
import { getTextContent } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
// services
import { store } from "@/lib/store-context";
import { PIService } from "@/services/pi.service";
import { EWorkspaceFeatures } from "../../core/types/workspace-feature";
import { useAiFlag } from "./store/use-ai-flag";

const piService = new PIService();

export const useDebouncedDuplicateIssues = (
  workspaceSlug: string | undefined,
  workspaceId: string | undefined,
  projectId: string | undefined,
  formData: {
    name: string | undefined;
    description_html?: string | undefined;
    issueId?: string | undefined;
  }
) => {
  // Check if the feature flag is enabled
  const isAiDedupeEnabled = useAiFlag(workspaceSlug, "AI_DEDUPE");
  const isFeatureEnabled =
    isAiDedupeEnabled &&
    !!workspaceSlug &&
    store.workspaceFeatures.isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED);

  // Debounce the name and description
  const debouncedName = useDebounce(formData?.name, 3000);
  const debouncedDescription = useDebounce(formData?.description_html, 3000);

  // Update debounced form data
  const debouncedFormData = useMemo(
    () => ({
      name: debouncedName,
      description_html: debouncedDescription,
    }),
    [debouncedName, debouncedDescription]
  );

  const shouldFetch =
    workspaceId && projectId && debouncedFormData.name && debouncedFormData.name.trim() !== "" && isFeatureEnabled;

  // Fetch duplicate issues
  const { data: issues } = useSWR(
    shouldFetch ? `DUPLICATE_ISSUE_${workspaceId}_${projectId}_${debouncedFormData.name}` : null,
    shouldFetch
      ? async () =>
          await piService.getDuplicateIssues({
            workspace_id: workspaceId.toString(),
            project_id: projectId,
            issue_id: formData?.issueId ?? null,
            title: debouncedFormData.name,
            description_stripped: getTextContent(debouncedFormData.description_html),
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const duplicateIssues: TDeDupeIssue[] = issues?.dupes ?? [];

  return { duplicateIssues };
};
