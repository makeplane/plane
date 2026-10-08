/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Loader } from "@plane/blocks/skeleton";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
// local imports
import { WorkItemTypesEmptyState } from "./empty-state";

export const WorkItemTypesRoot = observer(function WorkItemTypesRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const issueTypesStore = useIssueTypes();
  // translation
  const { t } = useTranslation();

  const { data: types, isLoading } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUE_TYPES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => issueTypesStore.fetchProjectIssueTypes(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return null;

  if (isLoading)
    return (
      <Loader className="space-y-5 md:w-2/3">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  if (!types?.length) return <WorkItemTypesEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label={t("work_item_types.create.button")}
          onClick={() => {
            // TODO(Task 5): open the create/update work item type modal
          }}
        />
      </div>
      <div className="flex flex-col divide-y divide-subtle rounded-md border border-subtle">
        {types.map((type) => (
          <div key={type.id} className="flex flex-col gap-1 p-4">
            <span className="text-13 font-medium text-primary">{type.name}</span>
            {type.description && <span className="text-11 text-tertiary">{type.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
});
