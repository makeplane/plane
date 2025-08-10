import React, { FC } from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft, CalendarIcon, ClockIcon, MessageSquare, Signal, Tag, Users } from "lucide-react";
// plane imports
import { TIssueType, TRecurringWorkItemActivity, TRecurringWorkItemActivityKeys } from "@plane/types";
import { DiceIcon, DoubleCircleIcon, LayersIcon } from "@plane/ui";
import { cn, joinUrlPath } from "@plane/utils";
// root store
import { store } from "@/lib/store-context";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";

const commonIconClassName = "size-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

export type TRecurringWorkItemActivityDetails = {
  icon: React.ReactNode;
  message: React.ReactNode;
  customUserName?: string;
};

export type TRecurringWorkItemActivityDetailsHelperMap = {
  [key in TRecurringWorkItemActivityKeys]: (activity: TRecurringWorkItemActivity) => TRecurringWorkItemActivityDetails;
};

type TWorkItemTypeDetail = {
  workItemType: string;
  className?: string;
};

const WorkItemTypeDetail: FC<TWorkItemTypeDetail> = observer((props) => {
  const { workItemType, className = "" } = props;

  let workItemTypeDetail: Partial<TIssueType> | undefined;

  try {
    workItemTypeDetail = JSON.parse(workItemType) as Partial<TIssueType> | undefined;
  } catch {
    workItemTypeDetail = undefined;
  }

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-custom-text-100", className)}>
      <IssueTypeLogo
        icon_props={workItemTypeDetail?.logo_props?.icon}
        size="xs"
        isDefault={workItemTypeDetail?.is_default}
      />
      {workItemTypeDetail?.name}
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

export const RECURRING_WORK_ITEM_ACTIVITY_HELPER_MAP: Partial<TRecurringWorkItemActivityDetailsHelperMap> = {
  recurring_workitem_created: () => ({
    icon: <LayersIcon className={commonIconClassName} />,
    message: <>created the recurring work item.</>,
  }),
  name_updated: (activity) => ({
    icon: <MessageSquare className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the name to", activity.new_value, ".")
    ) : (
      <>updated the name</>
    ),
  }),
  description_updated: () => ({
    icon: <MessageSquare className={commonIconClassName} />,
    message: <>updated the description</>,
  }),
  state_updated: (activity) => ({
    icon: <DoubleCircleIcon className={commonIconClassName} />,
    message: activity.new_value ? createValueMessage("set the state to", activity.new_value) : <>updated the state</>,
  }),
  assignees_added: (activity) => ({
    icon: <Users className={commonIconClassName} />,
    message: getAssigneeActivityMessage(activity, "added"),
  }),
  assignees_removed: (activity) => ({
    icon: <Users className={commonIconClassName} />,
    message: getAssigneeActivityMessage(activity, "removed"),
  }),
  priority_updated: (activity) => ({
    icon: <Signal className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the priority to", activity.new_value)
    ) : (
      <>updated the priority</>
    ),
  }),
  modules_added: (activity) => ({
    icon: <DiceIcon className={commonIconClassName} />,
    message: getModuleActivityMessage(activity, "added"),
  }),
  modules_removed: (activity) => ({
    icon: <DiceIcon className={commonIconClassName} />,
    message: getModuleActivityMessage(activity, "removed"),
  }),
  labels_added: (activity) => ({
    icon: <Tag className={commonIconClassName} />,
    message: activity.new_value ? createValueMessage("added a new label", activity.new_value) : <>added a new label</>,
  }),
  labels_removed: (activity) => ({
    icon: <Tag className={commonIconClassName} />,
    message: activity.old_value ? createValueMessage("removed the label", activity.old_value) : <>removed a label</>,
  }),
  type_updated: (activity) => ({
    icon: <ArrowRightLeft className={commonIconClassName} />,
    message: (
      <>
        {activity.new_value && activity.old_value ? (
          <>
            changed work item type to <WorkItemTypeDetail workItemType={activity.new_value} className="px-1" />
            from <WorkItemTypeDetail workItemType={activity.old_value} className="pl-1" />
          </>
        ) : (
          <>updated the work item type</>
        )}
      </>
    ),
  }),
  start_at_updated: (activity) => ({
    icon: <CalendarIcon className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the start date to", activity.new_value)
    ) : (
      <>updated the start date</>
    ),
  }),
  end_at_updated: (activity) => ({
    icon: <CalendarIcon className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the end date to", activity.new_value)
    ) : (
      <>updated the end date</>
    ),
  }),
  interval_type_updated: (activity) => ({
    icon: <ClockIcon className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the interval type to", activity.new_value)
    ) : (
      <>updated the interval type</>
    ),
  }),
};
