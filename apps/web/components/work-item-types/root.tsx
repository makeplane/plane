/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR, { useSWRConfig } from "swr";
// plane imports
import { PROJECT_ISSUE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import type { TIssueType } from "@plane/types";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
// local imports
import { CreateOrUpdateIssueTypeModal } from "./create-update/modal";
import { IssueTypeDeleteModal } from "./delete-modal";
import { WorkItemTypesEmptyState } from "./empty-state";
import { IssueTypesList } from "./issue-types-list";

export const WorkItemTypesRoot = observer(function WorkItemTypesRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const issueTypesStore = useIssueTypes();
  // swr
  const { mutate } = useSWRConfig();
  // translation
  const { t } = useTranslation();
  // states
  const [createUpdateModal, setCreateUpdateModal] = useState<{ isOpen: boolean; issueTypeId: string | null }>({
    isOpen: false,
    issueTypeId: null,
  });
  const [deleteModalIssueTypeId, setDeleteModalIssueTypeId] = useState<string | null>(null);

  const {
    data: types,
    isLoading,
    error,
  } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUE_TYPES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => issueTypesStore.fetchProjectIssueTypes(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return null;

  const handleEnableDisable = async (issueType: TIssueType) => {
    const action = issueType.is_active ? "disable" : "enable";
    try {
      await issueTypesStore.updateIssueType(workspaceSlug, projectId, issueType.id, {
        is_active: !issueType.is_active,
      });
      await mutate(PROJECT_ISSUE_TYPES(workspaceSlug, projectId));
      setToast({
        type: "success",
        title: t("work_item_types.enable_disable.toast.success.title"),
        message: t("work_item_types.enable_disable.toast.success.message", { name: issueType.name, action }),
      });
    } catch {
      setToast({
        type: "error",
        title: t("work_item_types.enable_disable.toast.error.title"),
        message: t("work_item_types.enable_disable.toast.error.message", { action }),
      });
    }
  };

  if (isLoading)
    return (
      <Loader className="space-y-5 md:w-2/3">
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
        <Loader.Item height="40px" />
      </Loader>
    );

  if (error && !types)
    return (
      <div className="flex w-full flex-col items-center justify-center gap-3 py-10">
        <p className="text-13 text-tertiary">{t("common.errors.default.message")}</p>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={t("common.retry")}
          onClick={() => void mutate(PROJECT_ISSUE_TYPES(workspaceSlug, projectId))}
        />
      </div>
    );

  if (!types?.length) return <WorkItemTypesEmptyState workspaceSlug={workspaceSlug} projectId={projectId} />;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            label={t("work_item_types.create.button")}
            onClick={() => setCreateUpdateModal({ isOpen: true, issueTypeId: null })}
          />
        </div>
        <IssueTypesList
          issueTypes={types}
          onEdit={(issueType) => setCreateUpdateModal({ isOpen: true, issueTypeId: issueType.id })}
          onDelete={(issueType) => setDeleteModalIssueTypeId(issueType.id)}
          onEnableDisable={handleEnableDisable}
        />
      </div>
      <CreateOrUpdateIssueTypeModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueTypeId={createUpdateModal.issueTypeId}
        isOpen={createUpdateModal.isOpen}
        handleClose={() => setCreateUpdateModal({ isOpen: false, issueTypeId: null })}
      />
      <IssueTypeDeleteModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueTypeId={deleteModalIssueTypeId}
        isOpen={Boolean(deleteModalIssueTypeId)}
        handleClose={() => setDeleteModalIssueTypeId(null)}
      />
    </>
  );
});
