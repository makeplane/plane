import React, { FC } from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft, CalendarIcon, ClockIcon, MessageSquare, Signal, Tag, Users } from "lucide-react";
// plane imports
import {
  DiceIcon,
  DoubleCircleIcon,
  RecurringWorkItemFailureIcon,
  RecurringWorkItemIcon,
  RecurringWorkItemSuccessIcon,
} from "@plane/propel/icons";
import {
  ERecurringWorkItemRunLogStatus,
  TBaseActivityVerbs,
  TRecurringWorkItemActivity,
  TRecurringWorkItemActivityKeys,
  TRecurringWorkItemActivityVerbs,
} from "@plane/types";
import { cn, joinUrlPath, renderFormattedDate } from "@plane/utils";
// root store
import { store } from "@/lib/store-context";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
import { IssuePropertyLogo } from "@/plane-web/components/issue-types/properties/common/issue-property-logo";
import { getWorkItemCustomPropertyActivityMessage } from "@/plane-web/helpers/work-item-custom-property-activity";
import { useIssueType } from "@/plane-web/hooks/store";

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
  name: string;
  id: string | undefined;
  className?: string;
};

const WorkItemTypeDetail: FC<TWorkItemTypeDetail> = observer((props) => {
  const { name, id, className = "" } = props;
  // store hooks
  const workItemTypeDetail = useIssueType(id);

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-custom-text-100", className)}>
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
      icon: <RecurringWorkItemIcon className={commonIconClassName} />,
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

  return {
    icon: propertyDetail?.logo_props?.in_use ? (
      <IssuePropertyLogo icon_props={propertyDetail.logo_props.icon} size={14} colorClassName="text-custom-text-200" />
    ) : (
      <RecurringWorkItemIcon className={commonIconClassName} />
    ),
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
    icon: <RecurringWorkItemIcon className={commonIconClassName} />,
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
    icon: <CalendarIcon className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the start date to", renderFormattedDate(activity.new_value) || "")
    ) : (
      <>updated the start date</>
    ),
  }),
  end_at_updated: (activity) => ({
    icon: <CalendarIcon className={commonIconClassName} />,
    message: activity.new_value ? (
      createValueMessage("set the end date to", renderFormattedDate(activity.new_value) || "")
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
  task_execution_completed: (activity) => ({
    icon: <RecurringWorkItemSuccessIcon className={commonIconClassName} />,
    message: getTaskExecutionActivityMessage(activity),
  }),
  task_execution_failed: (activity) => ({
    icon: <RecurringWorkItemFailureIcon className={commonIconClassName} />,
    message: getTaskExecutionActivityMessage(activity),
  }),
};
