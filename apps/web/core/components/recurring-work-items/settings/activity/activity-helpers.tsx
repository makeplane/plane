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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft, CalendarIcon, ClockIcon, MessageSquare } from "lucide-react";
// plane imports
import {
  DiceIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  RecurringWorkItemFailureIcon,
  RecurringWorkItemIcon,
  RecurringWorkItemSuccessIcon,
  StatePropertyIcon,
} from "@plane/propel/icons";
import type {
  TBaseActivityVerbs,
  TRecurringWorkItemActivity,
  TRecurringWorkItemActivityKeys,
  TRecurringWorkItemActivityVerbs,
} from "@plane/types";
import { ERecurringWorkItemRunLogStatus } from "@plane/types";
import { cn, joinUrlPath, renderFormattedDate } from "@plane/utils";
// root store
import { store } from "@/lib/store-context";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import { IssuePropertyLogo } from "@/components/work-item-types/properties/common/issue-property-logo";
import { getWorkItemCustomPropertyActivityMessage } from "@/helpers/workitem/activity";
import { useIssueType } from "@/plane-web/hooks/store";

const commonTextClassName = "text-primary font-medium";

export type TRecurringWorkItemActivityDetails = {
  icon: FC<{ className?: string }>;
  message: React.ReactNode;
  customUserName?: string;
};

export type TRecurringWorkItemActivityDetailsHelperMap = {
  [key in TRecurringWorkItemActivityKeys]: (activity: TRecurringWorkItemActivity) => TRecurringWorkItemActivityDetails;
};

type TWorkItemTypeDetail = {
  name: string;
  id: string | undefined;
  className?: string;
};

const WorkItemTypeDetail = observer(function WorkItemTypeDetail(props: TWorkItemTypeDetail) {
  const { name, id, className = "" } = props;
  // store hooks
  const workItemTypeDetail = useIssueType(id);

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-primary", className)}>
      {workItemTypeDetail?.logo_props?.in_use && (
        <IssueTypeLogo
          icon_props={workItemTypeDetail?.logo_props?.icon}
          size="xs"
          isDefault={workItemTypeDetail?.is_default}
        />
      )}
      {workItemTypeDetail?.name || name}
    </span>
  );
});

// Generic helper to create activity links
const createActivityLink = (href: string, text: string, className: string = commonTextClassName): React.ReactNode => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(className, "inline-flex items-center hover:underline capitalize")}
  >
    {text}
  </a>
);

// Generic helper to create simple value messages
const createValueMessage = (prefix: string, value: string, suffix: string = ""): React.ReactNode => (
  <>
    {prefix} <span className={commonTextClassName}>{value}</span>
    {suffix && ` ${suffix}`}
  </>
);

const getAssigneeActivityMessage = (activity: TRecurringWorkItemActivity, action: "added" | "removed") => {
  const workspaceSlug = store.workspaceRoot.getWorkspaceById(activity.workspace)?.slug;
  const activityIdentifier = activity.new_identifier ?? activity.old_identifier;
  const activityLabel = action === "added" ? "added a new assignee" : "removed the assignee";
  const activityValue = activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value;

  if (workspaceSlug && activityIdentifier && activityValue) {
    const href = joinUrlPath(workspaceSlug, "profile", activityIdentifier);
    return (
      <>
        {activityLabel} {createActivityLink(href, activityValue)}
      </>
    );
  }

  return (
    <>
      {activityLabel} {activityValue || ""}
    </>
  );
};

const getModuleActivityMessage = (activity: TRecurringWorkItemActivity, action: "added" | "removed") => {
  const workspaceSlug = store.workspaceRoot.getWorkspaceById(activity.workspace)?.slug;
  const activityIdentifier = activity.new_identifier ?? activity.old_identifier;
  const activityLabel =
    action === "added" ? "added this work item to the module" : "removed this work item from the module";
  const activityValue = activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value;

  if (workspaceSlug && activityIdentifier && activityValue) {
    const href = joinUrlPath(workspaceSlug, "projects", activity.project, "modules", activityIdentifier);
    return (
      <>
        {activityLabel} {createActivityLink(href, activityValue)}
      </>
    );
  }

  return (
    <>
      {activityLabel} {activityValue || ""}
    </>
  );
};

const getCustomPropertyActivityDetails = (activity: TRecurringWorkItemActivity): TRecurringWorkItemActivityDetails => {
  const propertyDetail = activity.property ? store.issueTypes.getIssuePropertyById(activity.property) : undefined;

  if (!propertyDetail)
    return {
      icon: RecurringWorkItemIcon,
      message: <>updated a deleted custom property</>,
    };

  const getActivityAction = (verb: TRecurringWorkItemActivityVerbs): TBaseActivityVerbs => {
    switch (verb) {
      case "created":
        return "created";
      case "added":
        return "created";
      case "updated":
        return "updated";
      case "removed":
        return "deleted";
      default:
        return "updated";
    }
  };

  // Create a wrapper component for IssuePropertyLogo since it needs special props
  const IconWrapper: FC<{ className?: string }> = ({ className }) => {
    if (propertyDetail?.logo_props?.in_use) {
      return (
        <IssuePropertyLogo icon_props={propertyDetail.logo_props.icon} size={14} colorClassName="text-secondary" />
      );
    }
    return <RecurringWorkItemIcon className={className} />;
  };

  return {
    icon: IconWrapper,
    message: getWorkItemCustomPropertyActivityMessage({
      action: getActivityAction(activity.verb),
      newValue: activity.new_value,
      oldValue: activity.old_value,
      propertyDetail,
      workspaceId: activity.workspace,
    }),
  };
};

const getTaskExecutionActivityMessage = (activity: TRecurringWorkItemActivity) => {
  const workspaceSlug = store.workspaceRoot.getWorkspaceById(activity.workspace)?.slug;
  const projectIdentifier = store.projectRoot.project.getProjectById(activity.project)?.identifier;
  const workItemSequenceId = activity.recurring_workitem_task_log?.workitem_sequence_id;

  if (activity.recurring_workitem_task_log?.status === ERecurringWorkItemRunLogStatus.SUCCESS) {
    return (
      <>
        successfully created a recurring work item
        {workspaceSlug && projectIdentifier && workItemSequenceId && (
          <>
            {" "}
            <a
              href={joinUrlPath(workspaceSlug, "browse", `${projectIdentifier}-${workItemSequenceId}`)}
              className={cn(commonTextClassName, "hover:underline")}
            >
              {`${projectIdentifier}-${workItemSequenceId}`}
            </a>
          </>
        )}
        .
      </>
    );
  } else if (activity.recurring_workitem_task_log?.status === ERecurringWorkItemRunLogStatus.FAILED) {
    return <>failed to create a recurring work item.</>;
  }
  return <>executed.</>;
};

export const RECURRING_WORK_ITEM_ACTIVITY_HELPER_MAP: Partial<TRecurringWorkItemActivityDetailsHelperMap> = {
  recurring_workitem_created: () => ({
    icon: RecurringWorkItemIcon,
    message: <>created the recurring work item.</>,
  }),
  name_updated: (activity) => ({
    icon: MessageSquare,
    message: activity.new_value ? (
      createValueMessage("set the name to", activity.new_value, ".")
    ) : (
      <>updated the name</>
    ),
  }),
  description_updated: () => ({
    icon: MessageSquare,
    message: <>updated the description</>,
  }),
  state_updated: (activity) => ({
    icon: StatePropertyIcon,
    message: activity.new_value ? createValueMessage("set the state to", activity.new_value) : <>updated the state</>,
  }),
  assignees_added: (activity) => ({
    icon: MembersPropertyIcon,
    message: getAssigneeActivityMessage(activity, "added"),
  }),
  assignees_removed: (activity) => ({
    icon: MembersPropertyIcon,
    message: getAssigneeActivityMessage(activity, "removed"),
  }),
  priority_updated: (activity) => ({
    icon: PriorityPropertyIcon,
    message: activity.new_value ? (
      createValueMessage("set the priority to", activity.new_value)
    ) : (
      <>updated the priority</>
    ),
  }),
  modules_added: (activity) => ({
    icon: DiceIcon,
    message: getModuleActivityMessage(activity, "added"),
  }),
  modules_removed: (activity) => ({
    icon: DiceIcon,
    message: getModuleActivityMessage(activity, "removed"),
  }),
  labels_added: (activity) => ({
    icon: LabelPropertyIcon,
    message: activity.new_value ? createValueMessage("added a new label", activity.new_value) : <>added a new label</>,
  }),
  labels_removed: (activity) => ({
    icon: LabelPropertyIcon,
    message: activity.old_value ? createValueMessage("removed the label", activity.old_value) : <>removed a label</>,
  }),
  type_updated: (activity) => ({
    icon: ArrowRightLeft,
    message: (
      <>
        {activity.new_value && activity.old_value ? (
          <>
            changed work item type to{" "}
            <WorkItemTypeDetail name={activity.new_value} id={activity.new_identifier} className="px-1" />
            from <WorkItemTypeDetail name={activity.old_value} id={activity.old_identifier} className="pl-1" />
          </>
        ) : (
          <>updated the work item type</>
        )}
      </>
    ),
  }),
  custom_property_created: (activity) => getCustomPropertyActivityDetails(activity),
  custom_property_updated: (activity) => getCustomPropertyActivityDetails(activity),
  start_at_updated: (activity) => ({
    icon: CalendarIcon,
    message: activity.new_value ? (
      createValueMessage("set the start date to", renderFormattedDate(activity.new_value) || "")
    ) : (
      <>updated the start date</>
    ),
  }),
  end_at_updated: (activity) => ({
    icon: CalendarIcon,
    message: activity.new_value ? (
      createValueMessage("set the end date to", renderFormattedDate(activity.new_value) || "")
    ) : (
      <>updated the end date</>
    ),
  }),
  interval_type_updated: (activity) => ({
    icon: ClockIcon,
    message: activity.new_value ? (
      createValueMessage("set the interval type to", activity.new_value)
    ) : (
      <>updated the interval type</>
    ),
  }),
  task_execution_completed: (activity) => ({
    icon: RecurringWorkItemSuccessIcon,
    message: getTaskExecutionActivityMessage(activity),
  }),
  task_execution_failed: (activity) => ({
    icon: RecurringWorkItemFailureIcon,
    message: getTaskExecutionActivityMessage(activity),
  }),
};
