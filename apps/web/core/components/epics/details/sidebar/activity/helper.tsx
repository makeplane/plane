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
import { AlignLeft, ArrowRightLeft, Briefcase, CalendarDays, FileText, Network, Paperclip, Type } from "lucide-react";
import {
  LinkIcon,
  CustomersIcon,
  EpicIcon,
  EstimatePropertyIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  MilestoneIcon,
  StatePropertyIcon,
} from "@plane/propel/icons";
import type { TBaseActivityVerbs, TIssueActivity } from "@plane/types";
import { convertMinutesToHoursMinutesString, getPageName, renderFormattedDate } from "@plane/utils";
import { LabelActivityChip } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { store } from "@/lib/store-context";
import { getRelationActivityContent } from "@/components/relations/activity";
import { WORK_ITEM_RELATION_OPTIONS } from "@/components/relations";
import type { TIssueRelationTypes } from "@/types";

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
  | "work_item"
  | "page"
  | "milestones";

export type TEpicActivityVerbs = TBaseActivityVerbs;

export type TEpicActivityKeys = `${TEpicActivityFields}_${TEpicActivityVerbs}`;

export type TEpicActivityDetails = {
  icon: FC<{ className?: string }>;
  message: ReactNode;
  customUserName?: string;
};

// Helper to create a wrapper component for relation icons that need size parameter
// TODO: update ISSUE_RELATION_OPTIONS constant icon type.
const createRelationIconWrapper = (relationType: TIssueRelationTypes | undefined): FC<{ className?: string }> => {
  return ({ className }) => {
    if (!relationType) {
      return <Network className={className} />;
    }
    const iconFn = WORK_ITEM_RELATION_OPTIONS[relationType]?.icon;
    if (!iconFn) {
      return <Network className={className} />;
    }
    // h-3.5 = 14px, which matches the original size parameter
    return <>{iconFn(14)}</>;
  };
};

export type TEpicActivityDetailsHelperMap = {
  [key in TEpicActivityKeys]: (activity: TIssueActivity) => TEpicActivityDetails;
};

const commonTextClassName = "text-primary font-medium";

// TODO: Add redirect link for relevant activities
export const EPIC_UPDATES_HELPER_MAP: Partial<TEpicActivityDetailsHelperMap> = {
  epic_created: () => ({
    icon: EpicIcon,
    message: <>created the epic.</>,
  }),
  epic_deleted: () => ({
    icon: EpicIcon,
    message: <>deleted the epic.</>,
  }),
  name_updated: (activity: TIssueActivity) => ({
    icon: Type,
    message: (
      <>
        renamed the epic to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: AlignLeft,
    message: <>updated the description.</>,
  }),
  state_updated: (activity: TIssueActivity) => ({
    icon: StatePropertyIcon,
    message: (
      <>
        set the state to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  assignees_updated: (activity: TIssueActivity) => ({
    icon: MembersPropertyIcon,
    message: (
      <>
        {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}
        <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  priority_updated: (activity: TIssueActivity) => ({
    icon: Briefcase,
    message: (
      <>
        set the priority to <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  start_date_updated: (activity: TIssueActivity) => ({
    icon: CalendarDays,
    message: (
      <>
        {activity.new_value ? `set the start date to ` : `removed the start date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-primary">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
      </>
    ),
  }),
  target_date_updated: (activity: TIssueActivity) => ({
    icon: CalendarDays,
    message: (
      <>
        {activity.new_value ? `set the due date to ` : `removed the due date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-primary">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
      </>
    ),
  }),
  labels_updated: (activity: TIssueActivity) => ({
    icon: LabelPropertyIcon,
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
    icon: EstimatePropertyIcon,
    message: (
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
        <span className={commonTextClassName}>{activity.new_value}</span>
      </>
    ),
  }),
  estimate_categories_updated: (activity: TIssueActivity) => ({
    icon: EstimatePropertyIcon,
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
      icon: EstimatePropertyIcon,
      message: (
        <>
          {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
          <span className={commonTextClassName}>{value}</span>
        </>
      ),
    };
  },
  relates_to_updated: (activity: TIssueActivity) => ({
    icon: createRelationIconWrapper(activity.field as TIssueRelationTypes | undefined),
    message: (
      <>
        <span className={commonTextClassName}>
          {getRelationActivityContent(activity)}{" "}
          {activity.old_value === "" ? (
            <span className="font-medium text-primary">{activity.new_value}.</span>
          ) : (
            <span className="font-medium text-primary">{activity.old_value}.</span>
          )}
        </span>
      </>
    ),
  }),
  link_created: (activity: TIssueActivity) => ({
    icon: LinkIcon,
    message: (
      <>
        added{" "}
        <a
          href={`${activity.new_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  link_updated: (activity: TIssueActivity) => ({
    icon: LinkIcon,
    message: (
      <>
        updated the{" "}
        <a
          href={`${activity.old_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  link_deleted: (activity: TIssueActivity) => ({
    icon: LinkIcon,
    message: (
      <>
        removed this{" "}
        <a
          href={`${activity.old_value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          link
        </a>
      </>
    ),
  }),
  attachment_created: () => ({
    icon: Paperclip,
    message: <>uploaded a new attachment</>,
  }),
  attachment_updated: () => ({
    icon: Paperclip,
    message: <>updated an attachment</>,
  }),
  attachment_deleted: () => ({
    icon: Paperclip,
    message: <>removed an attachment</>,
  }),
  customer_request_created: (activity: TIssueActivity) => ({
    icon: CustomersIcon,
    message: (
      <>
        added this epic to the customer request{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.new_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
        >
          <span className="truncate">{activity.new_value}</span>
        </a>
      </>
    ),
  }),
  customer_request_deleted: (activity: TIssueActivity) => ({
    icon: CustomersIcon,
    message: (
      <>
        removed this epic from the customer request{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
        >
          <span className="truncate">{activity.old_value}</span>
        </a>
      </>
    ),
  }),
  customer_created: (activity: TIssueActivity) => ({
    icon: CustomersIcon,
    message: (
      <>
        added this epic to the customer{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.new_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
        >
          <span className="truncate">{activity.new_value}</span>
        </a>
      </>
    ),
  }),
  customer_deleted: (activity: TIssueActivity) => ({
    icon: CustomersIcon,
    message: (
      <>
        removed this epic from the customer{" "}
        <a
          href={`/${activity.workspace_detail?.slug}/customers/${activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate font-medium text-primary hover:underline"
        >
          <span className="truncate">{activity.old_value}</span>
        </a>
      </>
    ),
  }),
  work_item_converted: (activity: TIssueActivity) => ({
    icon: ArrowRightLeft,
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
    icon: ArrowRightLeft,

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
  page_added: (activity: TIssueActivity) => ({
    icon: FileText,
    message: (
      <>
        added a new page <span className={commonTextClassName}>{getPageName(activity.new_value || "")}</span>.
      </>
    ),
  }),
  page_deleted: (activity: TIssueActivity) => ({
    icon: FileText,
    message: (
      <>
        removed the page <span className={commonTextClassName}>{getPageName(activity.old_value || "")}</span>.
      </>
    ),
  }),
  milestones_updated: (activity: TIssueActivity) => ({
    icon: MilestoneIcon,
    message: (
      <>
        set the milestone to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  milestones_deleted: (activity: TIssueActivity) => ({
    icon: MilestoneIcon,
    message: (
      <>
        removed the milestone <span className={commonTextClassName}>{activity.old_value}</span>.
      </>
    ),
  }),
  milestones_created: (activity: TIssueActivity) => ({
    icon: MilestoneIcon,
    message: (
      <>
        added this epic to the milestone <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
};
