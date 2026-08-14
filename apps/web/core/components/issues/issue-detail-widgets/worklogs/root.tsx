/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TIssueWorklog } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { IssueWorklogsCollapsibleContent } from "./content";
import { IssueWorklogCreateUpdateModal } from "./create-update-modal";
import { IssueWorklogsCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const WorklogsCollapsible = observer(function WorklogsCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const {
    openWidgets,
    toggleOpenWidget,
    isIssueWorklogModalOpen,
    issueWorklogData,
    toggleIssueWorklogModal,
    setIssueWorklogData,
    fetchWorklogs: fetchIssueWorklogs,
    createWorklog,
    updateWorklog,
    removeWorklog,
  } = useIssueDetail(issueServiceType);

  const project = getProjectById(projectId);
  const isTimeTrackingEnabled = Boolean(project?.is_time_tracking_enabled);
  const isCollapsibleOpen = openWidgets.includes("worklogs");
  const isProjectAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;
    void fetchIssueWorklogs(workspaceSlug, projectId, issueId);
  }, [workspaceSlug, projectId, issueId, fetchIssueWorklogs]);

  const canManage = (worklog: TIssueWorklog) =>
    isProjectAdmin || worklog.actor === currentUser?.id || worklog.created_by === currentUser?.id;

  const openCreate = () => {
    setIssueWorklogData(null);
    toggleIssueWorklogModal(true);
    if (!isCollapsibleOpen) toggleOpenWidget("worklogs");
  };

  const handleSubmit = async (payload: { duration: number; description?: string; logged_at?: string }) => {
    try {
      if (issueWorklogData) {
        await updateWorklog(workspaceSlug, projectId, issueId, issueWorklogData.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("worklog.toasts.updated.title"),
          message: t("worklog.toasts.updated.message"),
        });
      } else {
        await createWorklog(workspaceSlug, projectId, issueId, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("worklog.toasts.created.title"),
          message: t("worklog.toasts.created.message"),
        });
      }
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("worklog.toasts.error.title"),
        message: t("worklog.toasts.error.message"),
      });
      throw _error;
    }
  };

  const handleDelete = async (worklog: TIssueWorklog) => {
    try {
      await removeWorklog(workspaceSlug, projectId, issueId, worklog.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("worklog.toasts.deleted.title"),
        message: t("worklog.toasts.deleted.message"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("worklog.toasts.error.title"),
        message: t("worklog.toasts.error.message"),
      });
    }
  };

  return (
    <>
      <Collapsible
        isOpen={isCollapsibleOpen}
        onToggle={() => toggleOpenWidget("worklogs")}
        title={
          <IssueWorklogsCollapsibleTitle
            isOpen={isCollapsibleOpen}
            issueId={issueId}
            disabled={disabled || !isTimeTrackingEnabled}
            issueServiceType={issueServiceType}
            onLogTime={openCreate}
          />
        }
        buttonClassName="w-full"
      >
        <IssueWorklogsCollapsibleContent
          issueId={issueId}
          issueServiceType={issueServiceType}
          canManage={canManage}
          disabled={disabled || !isTimeTrackingEnabled}
          onEdit={(worklog) => {
            setIssueWorklogData(worklog);
            toggleIssueWorklogModal(true);
          }}
          onDelete={(worklog) => {
            void handleDelete(worklog);
          }}
        />
      </Collapsible>
      <IssueWorklogCreateUpdateModal
        isOpen={isIssueWorklogModalOpen}
        onClose={() => {
          toggleIssueWorklogModal(false);
          setIssueWorklogData(null);
        }}
        worklog={issueWorklogData}
        onSubmit={handleSubmit}
      />
    </>
  );
});
