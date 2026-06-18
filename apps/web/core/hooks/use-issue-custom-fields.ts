/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCustomFieldRawValue, TCustomFieldWithValue } from "@plane/types";
// hooks
import { useCustomField } from "@/hooks/store/use-custom-field";

type Params = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  enabled?: boolean;
};

/**
 * Shared loader for a work item's custom field definitions + values. Both the
 * sidebar Properties display and the Custom Fields activity tab use this with the
 * same SWR key, so an edit in one place instantly reflects in the other.
 */
export const useIssueCustomFields = (params: Params) => {
  const { workspaceSlug, projectId, issueId, enabled = true } = params;
  const { fetchIssueValues, updateIssueValues } = useCustomField();

  const swrKey =
    enabled && workspaceSlug && projectId && issueId ? `ISSUE_CUSTOM_FIELD_VALUES_${workspaceSlug}_${issueId}` : null;

  const { data, isLoading, mutate } = useSWR<TCustomFieldWithValue[]>(
    swrKey,
    swrKey ? () => fetchIssueValues(workspaceSlug, projectId, issueId) : null
  );

  const fields = data ?? [];

  const saveField = async (fieldId: string, value: TCustomFieldRawValue) => {
    try {
      const updated = await updateIssueValues(workspaceSlug, projectId, issueId, [{ custom_field: fieldId, value }]);
      // write the server response into the shared cache (no refetch needed)
      mutate(updated, { revalidate: false });
    } catch (_error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Could not save custom field. Please try again." });
      mutate();
    }
  };

  return { fields, isLoading, saveField };
};
