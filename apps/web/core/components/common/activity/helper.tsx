import type { FC, ReactNode } from "react";
import {
  RotateCcw,
  Network,
  Inbox,
  AlignLeft,
  Paperclip,
  Type,
  FileText,
  Hash,
  Clock,
  Bell,
  GitBranch,
  Timer,
  ListTodo,
  Layers,
} from "lucide-react";
// components

import {
  LinkIcon,
  ArchiveIcon,
  CycleIcon,
  GlobeIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  GridLayoutIcon,
  IntakeIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  ModuleIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  StatePropertyIcon,
} from "@plane/propel/icons";
import { store } from "@/lib/store-context";
import type { TProjectActivity } from "@/plane-web/types";

type ActivityIconMap = {
  [key: string]: FC<{ className?: string }>;
};
export const iconsMap: ActivityIconMap = {
  priority: PriorityPropertyIcon,
  archived_at: ArchiveIcon,
  restored: RotateCcw,
  link: LinkIcon,
  start_date: StartDatePropertyIcon,
  target_date: DueDatePropertyIcon,
  label: LabelPropertyIcon,
  inbox: Inbox,
  description: AlignLeft,
  assignee: MembersPropertyIcon,
  attachment: Paperclip,
  name: Type,
  state: StatePropertyIcon,
  estimate: EstimatePropertyIcon,
  cycle: CycleIcon,
  module: ModuleIcon,
  page: FileText,
  network: GlobeIcon,
  identifier: Hash,
  timezone: Clock,
  is_project_updates_enabled: Bell,
  is_epic_enabled: GridLayoutIcon,
  is_workflow_enabled: GitBranch,
  is_time_tracking_enabled: Timer,
  is_issue_type_enabled: ListTodo,
  default: Network,
  module_view: ModuleIcon,
  cycle_view: CycleIcon,
  issue_views_view: Layers,
  page_view: FileText,
  intake_view: IntakeIcon,
};

export const messages = (activity: TProjectActivity): { message: string | ReactNode; customUserName?: string } => {
  const activityType = activity.field;
  const newValue = activity.new_value;
  const oldValue = activity.old_value;
  const verb = activity.verb;
  const workspaceDetail = store.workspaceRoot.getWorkspaceById(activity.workspace);

  const getBooleanActionText = (value: string | undefined) => {
    if (value === "true") return "enabled";
    if (value === "false") return "disabled";
    return verb;
  };

  switch (activityType) {
    case "priority":
      return {
        message: (
          <>
            set the priority to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "archived_at":
      return {
        message: newValue === "restore" ? "restored the project" : "archived the project",
        customUserName: newValue === "archive" ? "Plane" : undefined,
      };
    case "name":
      return {
        message: (
          <>
            renamed the project to <span className="font-medium text-primary">{newValue}</span>
          </>
        ),
      };
    case "description":
      return {
        message: newValue ? "updated the project description" : "removed the project description",
      };
    case "start_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the start date to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              "removed the start date"
            )}
          </>
        ),
      };
    case "target_date":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the target date to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              "removed the target date"
            )}
          </>
        ),
      };
    case "state":
      return {
        message: (
          <>
            set the state to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "estimate":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the estimate point to <span className="font-medium text-primary">{newValue}</span>
              </>
            ) : (
              <>
                removed the estimate point
                {oldValue && (
                  <>
                    {" "}
                    <span className="font-medium text-primary">{oldValue}</span>
                  </>
                )}
              </>
            )}
          </>
        ),
      };
    case "cycles":
      return {
        message: (
          <>
            <span>
              {verb} this project {verb === "removed" ? "from" : "to"} the cycle{" "}
            </span>
            {verb !== "removed" ? (
              <a
                href={`/${workspaceDetail?.slug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex font-medium text-primary"
              >
                {activity.new_value}
              </a>
            ) : (
              <span className="font-medium text-primary">{activity.old_value || "Unknown cycle"}</span>
            )}
          </>
        ),
      };
    case "modules":
      return {
        message: (
          <>
            <span>
              {verb} this project {verb === "removed" ? "from" : "to"} the module{" "}
            </span>
            <span className="font-medium text-primary">
              {verb === "removed" ? oldValue : newValue || "Unknown module"}
            </span>
          </>
        ),
      };
    case "labels":
      return {
        message: (
          <>
            {verb} the label{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled label"}</span>
          </>
        ),
      };
    case "inbox":
      return {
        message: <>{newValue ? "enabled" : "disabled"} inbox</>,
      };
    case "page":
      return {
        message: (
          <>
            {newValue ? "created" : "removed"} the project page{" "}
            <span className="font-medium text-primary">{newValue || oldValue || "Untitled page"}</span>
          </>
        ),
      };
    case "network":
      return {
        message: <>{newValue ? "enabled" : "disabled"} network access</>,
      };
    case "identifier":
      return {
        message: (
          <>
            updated project identifier to <span className="font-medium text-primary">{newValue || "none"}</span>
          </>
        ),
      };
    case "timezone":
      return {
        message: (
          <>
            changed project timezone to <span className="font-medium text-primary">{newValue || "default"}</span>
          </>
        ),
      };
    case "module_view":
    case "cycle_view":
    case "issue_views_view":
    case "page_view":
    case "intake_view":
      return {
        message: (
          <>
            {getBooleanActionText(newValue)} {activityType.replace(/_view$/, "").replace(/_/g, " ")} view
          </>
        ),
      };
    case "is_project_updates_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} project updates</>,
      };
    case "is_epic_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} epics</>,
      };
    case "is_workflow_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} custom workflow</>,
      };
    case "is_time_tracking_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} time tracking</>,
      };
    case "is_issue_type_enabled":
      return {
        message: <>{getBooleanActionText(newValue)} work item types</>,
      };
    default:
      return {
        message: `${verb} ${activityType?.replace(/_/g, " ")} `,
      };
  }
};
