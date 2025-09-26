import { ReactNode } from "react";
import {
  AlignLeft,
  ArrowRightLeft,
  Briefcase,
  CalendarDays,
  Link,
  Paperclip,
  Tag,
  Triangle,
  Type,
  Users,
} from "lucide-react";
import { DoubleCircleIcon, EpicIcon, CustomersIcon } from "@plane/propel/icons";
import { TBaseActivityVerbs, TIssueActivity } from "@plane/types";
import { convertMinutesToHoursMinutesString, renderFormattedDate } from "@plane/utils";
import { LabelActivityChip } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { store } from "@/lib/store-context";
import { getRelationActivityContent, ISSUE_RELATION_OPTIONS } from "@/plane-web/components/relations";
import { TIssueRelationTypes } from "@/plane-web/types";

// Get the key for the issue property type based on the property type and relation type
export const getEpicActivityKey = (activityField: TEpicActivityFields | undefined, activityVerb: TEpicActivityVerbs) =>
  `${activityField ? `${activityField}_` : ""}${activityVerb}` as TEpicActivityKeys;

export type TEpicActivityFields =
  | "epic"
  | "name"
  | "description"
  | "state"
  | "assignees"
  | "priority"
  | "start_date"
  | "target_date"
  | "labels"
  | "estimate_point" /* This type is to handle all the older recorded activities for estimates. Field changed from  "estimate_point" -> `estimate_${estimate_type}`*/
  | "estimate_points"
  | "estimate_categories"
  | "estimate_time"
  | "relates_to"
  | "link"
  | "attachment"
  | "customer_request"
  | "customer"
  | "work_item";

export type TEpicActivityVerbs = TBaseActivityVerbs;

export type TEpicActivityKeys = `${TEpicActivityFields}_${TEpicActivityVerbs}`;

export type TEpicActivityDetails = {
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TEpicActivityDetailsHelperMap = {
  [key in TEpicActivityKeys]: (activity: TIssueActivity) => TEpicActivityDetails;
};

const commonIconClassName = "h-4 w-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

// TODO: Add redirect link for relevant activities
export const EPIC_UPDATES_HELPER_MAP: Partial<TEpicActivityDetailsHelperMap> = {
  epic_created: () => ({
    icon: <EpicIcon className={commonIconClassName} />,
    message: <>created the epic.</>,
  }),
  epic_deleted: () => ({
    icon: <EpicIcon className={commonIconClassName} />,
    message: <>deleted the epic.</>,
  }),
  name_updated: (activity: TIssueActivity) => ({
    icon: <Type className={commonIconClassName} />,
    message: (
      <>
        renamed the epic to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: <AlignLeft className={commonIconClassName} />,
    message: <>updated the description.</>,
  }),
  state_updated: (activity: TIssueActivity) => ({
    icon: <DoubleCircleIcon className={commonIconClassName} />,
    message: (
      <>
        set the state to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  assignees_updated: (activity: TIssueActivity) => ({
    icon: <Users className={commonIconClassName} />,
    message: (
      <>
        {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}
        <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  priority_updated: (activity: TIssueActivity) => ({
    icon: <Briefcase className={commonIconClassName} />,
    message: (
      <>
        set the priority to <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  start_date_updated: (activity: TIssueActivity) => ({
    icon: <CalendarDays className={commonIconClassName} />,
    message: (
      <>
        {activity.new_value ? `set the start date to ` : `removed the start date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
      </>
    ),
  }),
  target_date_updated: (activity: TIssueActivity) => ({
    icon: <CalendarDays className={commonIconClassName} />,
    message: (
      <>
        {activity.new_value ? `set the due date to ` : `removed the due date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
      </>
    ),
  }),
  labels_updated: (activity: TIssueActivity) => ({
    icon: <Tag className={commonIconClassName} />,
    message: (
      <>
        {activity.old_value === "" ? `added a new label ` : `removed the label `}
        <LabelActivityChip
          name={activity.old_value === "" ? activity.new_value : activity.old_value}
          color={
            activity.old_value === ""
              ? store.label.projectLabels?.find((l) => l.id === activity.new_identifier)?.color
              : store.label.projectLabels?.find((l) => l.id === activity.old_identifier)?.color
          }
        />
      </>
    ),
  }),
  estimate_points_updated: (activity: TIssueActivity) => ({
    icon: <Triangle className={commonIconClassName} />,
    message: (
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
        <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  estimate_categories_updated: (activity: TIssueActivity) => ({
    icon: <Triangle className={commonIconClassName} />,
    message: (
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
        <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  estimate_time_updated: (activity: TIssueActivity) => {
    const value = convertMinutesToHoursMinutesString(Number(activity.new_value));
    return {
      icon: <Triangle className={commonIconClassName} />,
      message: (
        <>
          {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
          <span className={commonTextClassName}>{value}</span>
        </>
      ),
    };
  },
  relates_to_updated: (activity: TIssueActivity) => ({
    icon: activity.field ? ISSUE_RELATION_OPTIONS[activity.field as TIssueRelationTypes]?.icon(14) : <></>,
    message: (
      <>
        <span className={commonTextClassName}>
          {getRelationActivityContent(activity)}{" "}
          {activity.old_value === "" ? (
            <span className="font-medium text-custom-text-100">{activity.new_value}.</span>
          ) : (
            <span className="font-medium text-custom-text-100">{activity.old_value}.</span>
          )}
        </span>
      </>
    ),
  }),
  link_created: (activity: TIssueActivity) => ({
    icon: <Link className={commonIconClassName} />,
    message: (
      <>
        added{" "}
        <a
          href={`${activity.new_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  link_updated: (activity: TIssueActivity) => ({
    icon: <Link className={commonIconClassName} />,
    message: (
      <>
        updated the{" "}
        <a
          href={`${activity.old_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  link_deleted: (activity: TIssueActivity) => ({
    icon: <Link className={commonIconClassName} />,
    message: (
      <>
        removed this{" "}
        <a
          href={`${activity.old_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  attachment_created: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>uploaded a new attachment</>,
  }),
  attachment_updated: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>updated an attachment</>,
  }),
  attachment_deleted: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>removed an attachment</>,
  }),
  customer_request_created: (activity: TIssueActivity) => ({
    icon: <CustomersIcon className={commonIconClassName} />,
    message: (
      <>
        added this epic to the customer request{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.new_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
        >
          <span className="truncate">{activity.new_value}</span>
        </a>
      </>
    ),
  }),
  customer_request_deleted: (activity: TIssueActivity) => ({
    icon: <CustomersIcon className={commonIconClassName} />,
    message: (
      <>
        removed this epic from the customer request{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
        >
          <span className="truncate">{activity.old_value}</span>
        </a>
      </>
    ),
  }),
  customer_created: (activity: TIssueActivity) => ({
    icon: <CustomersIcon className={commonIconClassName} />,
    message: (
      <>
        added this epic to the customer{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.new_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
        >
          <span className="truncate">{activity.new_value}</span>
        </a>
      </>
    ),
  }),
  customer_deleted: (activity: TIssueActivity) => ({
    icon: <CustomersIcon className={commonIconClassName} />,
    message: (
      <>
        removed this epic from the customer{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
        >
          <span className="truncate">{activity.old_value}</span>
        </a>
      </>
    ),
  }),
  work_item_converted: (activity: TIssueActivity) => ({
    icon: <ArrowRightLeft className={commonIconClassName} />,
    message: (
      <>
        converted{" "}
        <span
          className={commonTextClassName}
        >{`${activity?.project_detail?.identifier}-${activity?.issue_detail?.sequence_id}`}</span>{" "}
        to epic.
      </>
    ),
  }),
  epic_converted: (activity: TIssueActivity) => ({
    icon: <ArrowRightLeft className={commonIconClassName} />,

    message: (
      <>
        converted{" "}
        <span
          className={commonTextClassName}
        >{`${activity?.project_detail?.identifier}-${activity?.issue_detail?.sequence_id}`}</span>{" "}
        to work item.
      </>
    ),
  }),
};
