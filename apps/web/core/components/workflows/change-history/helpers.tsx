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

import type { FC, ReactNode } from "react";
import { ApproverIcon, LayersIcon, WorkflowIcon } from "@plane/propel/icons";
import type { TWorkflowChangeHistory, TWorkflowChangeHistoryKeys } from "@plane/types";
import { store } from "@/lib/store-context";

export type TWorkflowChangeHistoryDetails = {
  icon: FC<{ className?: string }>;
  message: ReactNode;
  customUserName?: string;
};

export type TWorkflowChangeHistoryDetailsHelperMap = {
  [key in TWorkflowChangeHistoryKeys]: (changeHistory: TWorkflowChangeHistory) => TWorkflowChangeHistoryDetails;
};

const commonTextClassName = "text-primary font-medium";

export const WORKFLOW_CHANGE_HISTORY_HELPER_MAP: Partial<TWorkflowChangeHistoryDetailsHelperMap> = {
  workflow_created: () => ({
    icon: WorkflowIcon,
    message: <>created the workflow.</>,
  }),
  is_workflow_enabled_enabled: () => ({
    icon: WorkflowIcon,
    message: <>enabled the workflow.</>,
  }),
  is_workflow_enabled_disabled: () => ({
    icon: WorkflowIcon,
    message: <>disabled the workflow.</>,
  }),
  reset_updated: () => ({
    icon: WorkflowIcon,
    message: <>reset the workflow.</>,
  }),
  workflow_name_updated: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        renamed the workflow to{" "}
        {activity.new_value ? <span className={commonTextClassName}>{activity.new_value}</span> : "a new name"}.
      </>
    ),
  }),
  workflow_description_updated: () => ({
    icon: WorkflowIcon,
    message: <>updated the workflow description.</>,
  }),
  workflow_type_updated: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        updated the workflow type to{" "}
        {activity.new_value ? <span className={commonTextClassName}>{activity.new_value}</span> : "a new type"}.
      </>
    ),
  }),
  workflow_is_active_updated: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: <>{activity.new_value === "True" ? "activated" : "deactivated"} the workflow.</>,
  }),
  workflow_work_item_type_added: (activity: TWorkflowChangeHistory) => ({
    icon: LayersIcon,
    message: (
      <>
        added{" "}
        {activity.new_value ? <span className={commonTextClassName}>{activity.new_value}</span> : "a work item type"} to
        the workflow.
      </>
    ),
  }),
  workflow_work_item_type_removed: (activity: TWorkflowChangeHistory) => ({
    icon: LayersIcon,
    message: (
      <>
        removed{" "}
        {activity.old_value ? <span className={commonTextClassName}>{activity.old_value}</span> : "a work item type"}{" "}
        from the workflow.
      </>
    ),
  }),
  workflow_state_added: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        added{" "}
        <span className={commonTextClassName}>
          {activity.new_identifier
            ? (store.state.getStateById(activity.new_identifier)?.name ?? activity.new_value)
            : activity.new_value}
        </span>{" "}
        to the workflow.
      </>
    ),
  }),
  workflow_state_removed: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        removed{" "}
        <span className={commonTextClassName}>
          {activity.old_identifier
            ? (store.state.getStateById(activity.old_identifier)?.name ?? activity.old_value)
            : activity.old_value}
        </span>{" "}
        from the workflow.
      </>
    ),
  }),
  workflow_state_transferred_updated: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        moved <span className={commonTextClassName}>{activity.comment} work items</span> from{" "}
        <span className={commonTextClassName}>
          {activity.old_identifier
            ? (store.state.getStateById(activity.old_identifier)?.name ?? activity.old_value)
            : activity.old_value}
        </span>{" "}
        to{" "}
        <span className={commonTextClassName}>
          {activity.new_identifier
            ? (store.state.getStateById(activity.new_identifier)?.name ?? activity.new_value)
            : activity.new_value}
        </span>{" "}
        due to state removal.
      </>
    ),
  }),
  allow_work_item_creation_enabled: (activity: TWorkflowChangeHistory) => ({
    icon: LayersIcon,
    message: (
      <>
        allowed new work item creation in{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  allow_work_item_creation_disabled: (activity: TWorkflowChangeHistory) => ({
    icon: LayersIcon,
    message: (
      <>
        disallowed new work item creation in{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  state_transition_added: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        added a state-change rule from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span> to{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.new_identifier)?.name}</span>.
      </>
    ),
  }),
  state_transition_removed: (activity: TWorkflowChangeHistory) => ({
    icon: WorkflowIcon,
    message: (
      <>
        removed a state-change rule from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span> to{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.old_identifier)?.name}</span>.
      </>
    ),
  }),
  state_approvers_added: (activity: TWorkflowChangeHistory) => ({
    icon: ApproverIcon,
    message: (
      <>
        added{" "}
        <span className={commonTextClassName}>
          {activity.new_identifier
            ? (store.memberRoot.getUserDetails(activity.new_identifier)?.display_name ?? activity.new_value)
            : activity.new_value}
        </span>{" "}
        as an approver for state changes from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
  state_approvers_removed: (activity: TWorkflowChangeHistory) => ({
    icon: ApproverIcon,
    message: (
      <>
        removed{" "}
        <span className={commonTextClassName}>
          {activity.old_identifier
            ? (store.memberRoot.getUserDetails(activity.old_identifier)?.display_name ?? activity.old_value)
            : activity.old_value}
        </span>{" "}
        from the approvers list for state changes from{" "}
        <span className={commonTextClassName}>{store.state.getStateById(activity.state_id)?.name}</span>.
      </>
    ),
  }),
};
