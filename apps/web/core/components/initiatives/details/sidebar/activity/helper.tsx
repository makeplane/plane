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
import { AlignLeft, Paperclip, Type } from "lucide-react";
import {
  LinkIcon,
  CalendarLayoutIcon,
  EpicIcon,
  InitiativeIcon,
  MembersPropertyIcon,
  ProjectIcon,
} from "@plane/propel/icons";
import type { TBaseActivityVerbs } from "@plane/types";
import { store } from "@/lib/store-context";
import type { TInitiativeActivity } from "@/types/initiative";

// Get the key for the issue property type based on the property type and relation type
export const getInitiativeActivityKey = (
  activityField: TInitiativeActivityFields | undefined,
  activityVerb: TInitiativeActivityVerbs
) => `${activityField ? `${activityField}_` : ""}${activityVerb}` as TInitiativeActivityKeys;

export type TInitiativeActivityFields =
  | "initiative"
  | "name"
  | "description"
  | "lead"
  | "link"
  | "attachment"
  | "projects"
  | "epics"
  | "start_date"
  | "end_date";

export type TInitiativeActivityVerbs = TBaseActivityVerbs;

export type TInitiativeActivityKeys = `${TInitiativeActivityFields}_${TInitiativeActivityVerbs}`;

export type TInitiativeActivityDetails = {
  icon: FC<{ className?: string }>;
  message: ReactNode;
  customUserName?: string;
};

export type TInitiativeActivityDetailsHelperMap = {
  [key in TInitiativeActivityKeys]: (activity: TInitiativeActivity) => TInitiativeActivityDetails;
};

const commonTextClassName = "text-primary font-medium";

// TODO: Add redirect link for relevant activities
export const INITIATIVE_UPDATES_HELPER_MAP: Partial<TInitiativeActivityDetailsHelperMap> = {
  initiative_created: () => ({
    icon: InitiativeIcon,
    message: <>created the initiative.</>,
  }),
  initiative_deleted: () => ({
    icon: InitiativeIcon,
    message: <>deleted the initiative.</>,
  }),
  name_updated: (activity: TInitiativeActivity) => ({
    icon: Type,
    message: (
      <>
        renamed the initiative to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: AlignLeft,
    message: <>updated the initiative description.</>,
  }),
  lead_updated: (activity: TInitiativeActivity) => ({
    icon: MembersPropertyIcon,
    message: (
      <>
        {activity.old_identifier && activity.new_identifier ? (
          <>
            changed the lead to{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_identifier)?.display_name}
            </span>{" "}
            from{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_identifier)?.display_name}
            </span>
            .
          </>
        ) : activity.old_identifier ? (
          <>
            removed{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.old_identifier)?.display_name}
            </span>{" "}
            as initiative lead.
          </>
        ) : activity.new_identifier ? (
          <>
            set the lead to{" "}
            <span className={commonTextClassName}>
              {store.memberRoot.getUserDetails(activity.new_identifier)?.display_name}
            </span>
            .
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  projects_updated: (activity: TInitiativeActivity) => ({
    icon: ProjectIcon,
    message: (
      <>
        {activity.old_value ? (
          <>
            removed project <span className={commonTextClassName}>{activity.old_value}</span> from the initiative.
          </>
        ) : activity.new_value ? (
          <>
            added project <span className={commonTextClassName}>{activity.new_value}</span> to the initiative.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  epics_updated: (activity: TInitiativeActivity) => ({
    icon: EpicIcon,
    message: (
      <>
        {activity.old_value ? (
          <>
            removed epic <span className={commonTextClassName}>{activity.old_value}</span> from the initiative.
          </>
        ) : activity.new_value ? (
          <>
            added epic <span className={commonTextClassName}>{activity.new_value}</span> to the initiative.
          </>
        ) : (
          <></>
        )}
      </>
    ),
  }),
  start_date_updated: () => ({
    icon: CalendarLayoutIcon,
    message: <>updated the start date.</>,
  }),
  end_date_updated: () => ({
    icon: CalendarLayoutIcon,
    message: <>updated the end date.</>,
  }),
  link_created: () => ({
    icon: LinkIcon,
    message: <>created a link</>,
  }),
  link_updated: () => ({
    icon: LinkIcon,
    message: <>updated the link</>,
  }),
  link_deleted: () => ({
    icon: LinkIcon,
    message: <>deleted the link</>,
  }),
  attachment_created: () => ({
    icon: Paperclip,
    message: <>created an attachment</>,
  }),
  attachment_updated: () => ({
    icon: Paperclip,
    message: <>updated the attachment</>,
  }),
  attachment_deleted: () => ({
    icon: Paperclip,
    message: <>deleted the attachment</>,
  }),
};
