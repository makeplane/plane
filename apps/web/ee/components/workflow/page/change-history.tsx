"use client";

import React, { FC, ReactNode, useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader as Spinner, X } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { ApproverIcon, LayersIcon, WorkflowIcon } from "@plane/propel/icons";
import { TWorkflowChangeHistory, TWorkflowChangeHistoryKeys } from "@plane/types";
import { getButtonStyling, Loader } from "@plane/ui";
import { cn, getWorkflowChangeHistoryKey } from "@plane/utils";
// helpers
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web hooks
import { store } from "@/lib/store-context";

type TWorkflowChangeHistoryProps = {
  isOpen: boolean;
  projectId: string;
  workspaceSlug: string;
  onClose: () => void;
};

type TWorkflowChangeHistoryItemProps = {
  changeHistory: TWorkflowChangeHistory;
  ends: "top" | "bottom" | undefined;
};

export type TWorkflowChangeHistoryDetails = {
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TWorkflowChangeHistoryDetailsHelperMap = {
  [key in TWorkflowChangeHistoryKeys]: (changeHistory: TWorkflowChangeHistory) => TWorkflowChangeHistoryDetails;
};

const commonIconClassName = "h-4 w-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

export const WORKFLOW_CHANGE_HISTORY_HELPER_MAP: Partial<TWorkflowChangeHistoryDetailsHelperMap> = {
  is_workflow_enabled_enabled: () => ({
    icon: <WorkflowIcon className={commonIconClassName} />,
    message: <>enabled the workflow.</>,
  }),
  is_workflow_enabled_disabled: () => ({
    icon: <WorkflowIcon className={commonIconClassName} />,
    message: <>disabled the workflow.</>,
  }),
  reset_updated: () => ({
    icon: <WorkflowIcon className={commonIconClassName} />,
    message: <>reset the workflow.</>,
  }),
  allow_work_item_creation_enabled: (activity: TWorkflowChangeHistory) => ({
    icon: <LayersIcon className={commonIconClassName} />,
    message: (
      <>
        allowed new work item creation in{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  allow_work_item_creation_disabled: (activity: TWorkflowChangeHistory) => ({
    icon: <LayersIcon className={commonIconClassName} />,
    message: (
      <>
        disallowed new work item creation in{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  state_transition_added: (activity: TWorkflowChangeHistory) => ({
    icon: <WorkflowIcon className={commonIconClassName} />,
    message: (
      <>
        added a state-change rule from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span> to{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.new_identifier)?.name}</span>.
      </>
    ),
  }),
  state_transition_removed: (activity: TWorkflowChangeHistory) => ({
    icon: <WorkflowIcon className={commonIconClassName} />,
    message: (
      <>
        removed a state-change rule from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span> to{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.old_identifier)?.name}</span>.
      </>
    ),
  }),
  state_transition_approver_added: (activity: TWorkflowChangeHistory) => ({
    icon: <ApproverIcon className={commonIconClassName} />,
    message: (
      <>
        made{" "}
        {activity.new_identifier && (
          <span className={commonTextClassName}>
            {store.memberRoot.getUserDetails(activity.new_identifier)?.display_name}
          </span>
        )}{" "}
        a mover for state changes from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  state_transition_approver_removed: (activity: TWorkflowChangeHistory) => ({
    icon: <ApproverIcon className={commonIconClassName} />,
    message: (
      <>
        removed{" "}
        {activity.old_identifier && (
          <span className={commonTextClassName}>
            {store.memberRoot.getUserDetails(activity.old_identifier)?.display_name}
          </span>
        )}{" "}
        from the movers list for state changes from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
};

export const WorkflowChangeHistoryItem = observer((props: TWorkflowChangeHistoryItemProps) => {
  const { changeHistory, ends } = props;
  // return if activity details are not available
  if (!changeHistory) return <></>;
  // derived values
  const workflowChangeHistoryKey = getWorkflowChangeHistoryKey(changeHistory.field, changeHistory.verb);
  const getWorkflowChangeHistory = WORKFLOW_CHANGE_HISTORY_HELPER_MAP[workflowChangeHistoryKey];

  if (getWorkflowChangeHistory) {
    const { icon, message, customUserName } = getWorkflowChangeHistory(changeHistory);
    return (
      <ActivityBlockComponent icon={icon} activity={changeHistory} ends={ends} customUserName={customUserName}>
        <>{message}</>
      </ActivityBlockComponent>
    );
  }

  return <></>;
});

export const WorkflowChangeHistory: FC<TWorkflowChangeHistoryProps> = observer((props) => {
  const { isOpen, projectId, workspaceSlug, onClose } = props;
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    getWorkflowChangeHistorySortOrder,
    getWorkflowChangeHistoryLoader,
    getWorkflowChangeHistory,
    toggleWorkflowChangeHistorySortOrder,
    fetchWorkflowChangeHistory,
  } = useProjectState();
  // derived values
  const workflowChangeHistoryLoader = getWorkflowChangeHistoryLoader(projectId);
  const workflowChangeHistory = getWorkflowChangeHistory(projectId);
  const workflowChangeHistorySortOrder = getWorkflowChangeHistorySortOrder();

  // fetching workflow change history
  useSWR(
    workspaceSlug && projectId && isOpen ? ["workflowChangeHistory", workspaceSlug, projectId, isOpen] : null,
    workspaceSlug && projectId && isOpen
      ? () => fetchWorkflowChangeHistory(workspaceSlug!.toString(), projectId)
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  useOutsideClickDetector(ref, () => {
    if (isOpen) {
      onClose();
    }
  });

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-0 right-0 h-full z-[19] -my-6 -mx-4 flex flex-col justify-between gap-4 w-[368px] transform transition-all duration-300 ease-in-out bg-custom-sidebar-background-100 border-l border-custom-sidebar-border-200 shadow-md py-4",
        {
          "opacity-100": isOpen,
          "opacity-0 invisible": !isOpen,
        }
      )}
      style={{
        height: "calc(100% + 2.7rem)",
      }}
    >
      <div className="relative flex flex-col gap-y-2 h-full overflow-hidden">
        <div className="p-4 pt-2 flex flex-col">
          <div className="flex gap-2 items-center justify-between">
            <span className="text-lg font-medium">{t("common.change_history")}</span>
            <span className="flex items-center gap-2">
              {workflowChangeHistoryLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
              <ActivitySortRoot
                sortOrder={workflowChangeHistorySortOrder}
                toggleSort={toggleWorkflowChangeHistorySortOrder}
                className="py-1"
                iconClassName="size-3"
              />
              <div
                className={cn(
                  getButtonStyling("neutral-primary", "sm"),
                  "py-1 px-2 text-custom-text-300 cursor-pointer"
                )}
                onClick={onClose}
              >
                <X className="size-3" />
              </div>
            </span>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto vertical-scrollbar scrollbar-sm px-4">
          <div className="space-y-3">
            {workflowChangeHistoryLoader === "init-loader" ? (
              <Loader className="space-y-3">
                <Loader.Item height="34px" width="100%" />
                <Loader.Item height="34px" width="100%" />
                <Loader.Item height="34px" width="100%" />
              </Loader>
            ) : (
              <div>
                {workflowChangeHistory &&
                  workflowChangeHistory.map((changeHistory, index) => (
                    <WorkflowChangeHistoryItem
                      key={changeHistory.id}
                      changeHistory={changeHistory}
                      ends={index === 0 ? "top" : index === workflowChangeHistory.length - 1 ? "bottom" : undefined}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
