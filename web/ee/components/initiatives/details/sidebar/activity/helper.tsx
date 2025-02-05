import { ReactNode } from "react";
import { AlignLeft, Briefcase, Calendar, Link, Paperclip, Type, Users } from "lucide-react";
import { TBaseActivityVerbs } from "@plane/types";
import { EpicIcon, InitiativeIcon } from "@plane/ui";
import { store } from "@/lib/store-context";
import { TInitiativeActivity } from "@/plane-web/types/initiative";

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
  icon: ReactNode;
  message: ReactNode;
  customUserName?: string;
};

export type TInitiativeActivityDetailsHelperMap = {
  [key in TInitiativeActivityKeys]: (activity: TInitiativeActivity) => TInitiativeActivityDetails;
};

const commonIconClassName = "h-4 w-4 flex-shrink-0 text-custom-text-300";
const commonTextClassName = "text-custom-text-100 font-medium";

// TODO: Add redirect link for relevant activities
export const INITIATIVE_UPDATES_HELPER_MAP: Partial<TInitiativeActivityDetailsHelperMap> = {
  initiative_created: () => ({
    icon: <InitiativeIcon className={commonIconClassName} />,
    message: <>created the initiative.</>,
  }),
  initiative_deleted: () => ({
    icon: <InitiativeIcon className={commonIconClassName} />,
    message: <>deleted the initiative.</>,
  }),
  name_updated: (activity: TInitiativeActivity) => ({
    icon: <Type className={commonIconClassName} />,
    message: (
      <>
        renamed the initiative to <span className={commonTextClassName}>{activity.new_value}</span>.
      </>
    ),
  }),
  description_updated: () => ({
    icon: <AlignLeft className={commonIconClassName} />,
    message: <>updated the initiative description.</>,
  }),
  lead_updated: (activity: TInitiativeActivity) => ({
    icon: <Users className={commonIconClassName} />,
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
    icon: <Briefcase className={commonIconClassName} />,
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
    icon: <EpicIcon className={commonIconClassName} />,
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
    icon: <Calendar className={commonIconClassName} />,
    message: <>updated the start date.</>,
  }),
  end_date_updated: () => ({
    icon: <Calendar className={commonIconClassName} />,
    message: <>updated the end date.</>,
  }),
  link_created: () => ({
    icon: <Link className={commonIconClassName} />,
    message: <>created a link</>,
  }),
  link_updated: () => ({
    icon: <Link className={commonIconClassName} />,
    message: <>updated the link</>,
  }),
  link_deleted: () => ({
    icon: <Link className={commonIconClassName} />,
    message: <>deleted the link</>,
  }),
  attachment_created: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>created an attachment</>,
  }),
  attachment_updated: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>updated the attachment</>,
  }),
  attachment_deleted: () => ({
    icon: <Paperclip className={commonIconClassName} />,
    message: <>deleted the attachment</>,
  }),
};
