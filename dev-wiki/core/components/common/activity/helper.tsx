import { ReactNode } from "react";
import {
  Signal,
  RotateCcw,
  Network,
  Link as LinkIcon,
  Calendar,
  Tag,
  Inbox,
  AlignLeft,
  Users,
  Paperclip,
  Type,
  Triangle,
  FileText,
  Globe,
  Hash,
  Clock,
  Bell,
  LayoutGrid,
  GitBranch,
  Timer,
  ListTodo,
  Layers,
} from "lucide-react";

// components
import { ArchiveIcon, DoubleCircleIcon, ContrastIcon, DiceIcon, Intake } from "@plane/ui";
import { store } from "@/lib/store-context";
import { TProjectActivity } from "@/plane-web/types";

type ActivityIconMap = {
  [key: string]: ReactNode;
};
export const iconsMap: ActivityIconMap = {
  priority: <Signal size={14} className="text-custom-text-200" />,
  archived_at: <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-200" />,
  restored: <RotateCcw className="h-3.5 w-3.5 text-custom-text-200" />,
  link: <LinkIcon className="h-3.5 w-3.5 text-custom-text-200" />,
  start_date: <Calendar className="h-3.5 w-3.5 text-custom-text-200" />,
  target_date: <Calendar className="h-3.5 w-3.5 text-custom-text-200" />,
  label: <Tag className="h-3.5 w-3.5 text-custom-text-200" />,
  inbox: <Inbox className="h-3.5 w-3.5 text-custom-text-200" />,
  description: <AlignLeft className="h-3.5 w-3.5 text-custom-text-200" />,
  assignee: <Users className="h-3.5 w-3.5 text-custom-text-200" />,
  attachment: <Paperclip className="h-3.5 w-3.5 text-custom-text-200" />,
  name: <Type className="h-3.5 w-3.5 text-custom-text-200" />,
  state: <DoubleCircleIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  estimate: <Triangle size={14} className="text-custom-text-200" />,
  cycle: <ContrastIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  module: <DiceIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  page: <FileText className="h-3.5 w-3.5 text-custom-text-200" />,
  network: <Globe className="h-3.5 w-3.5 text-custom-text-200" />,
  identifier: <Hash className="h-3.5 w-3.5 text-custom-text-200" />,
  timezone: <Clock className="h-3.5 w-3.5 text-custom-text-200" />,
  is_project_updates_enabled: <Bell className="h-3.5 w-3.5 text-custom-text-200" />,
  is_epic_enabled: <LayoutGrid className="h-3.5 w-3.5 text-custom-text-200" />,
  is_workflow_enabled: <GitBranch className="h-3.5 w-3.5 text-custom-text-200" />,
  is_time_tracking_enabled: <Timer className="h-3.5 w-3.5 text-custom-text-200" />,
  is_issue_type_enabled: <ListTodo className="h-3.5 w-3.5 text-custom-text-200" />,
  default: <Network className="h-3.5 w-3.5 text-custom-text-200" />,
  module_view: <DiceIcon className="h-3.5 w-3.5 text-custom-text-200" />,
  cycle_view: <ContrastIcon className="h-3.5 w-3.5 text-custom-text-200" />,
  issue_views_view: <Layers className="h-3.5 w-3.5 text-custom-text-200" />,
  page_view: <FileText className="h-3.5 w-3.5 text-custom-text-200" />,
  intake_view: <Intake className="h-3.5 w-3.5 text-custom-text-200" />,
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
            set the priority to <span className="font-medium text-custom-text-100">{newValue || "none"}</span>
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
            renamed the project to <span className="font-medium text-custom-text-100">{newValue}</span>
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
                set the start date to <span className="font-medium text-custom-text-100">{newValue}</span>
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
                set the target date to <span className="font-medium text-custom-text-100">{newValue}</span>
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
            set the state to <span className="font-medium text-custom-text-100">{newValue || "none"}</span>
          </>
        ),
      };
    case "estimate":
      return {
        message: (
          <>
            {newValue ? (
              <>
                set the estimate point to <span className="font-medium text-custom-text-100">{newValue}</span>
              </>
            ) : (
              <>
                removed the estimate point
                {oldValue && (
                  <>
                    {" "}
                    <span className="font-medium text-custom-text-100">{oldValue}</span>
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
                className="inline-flex font-medium text-custom-text-100"
              >
                {activity.new_value}
              </a>
            ) : (
              <span className="font-medium text-custom-text-100">{activity.old_value || "Unknown cycle"}</span>
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
            <span className="font-medium text-custom-text-100">
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
            <span className="font-medium text-custom-text-100">{newValue || oldValue || "Untitled label"}</span>
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
            <span className="font-medium text-custom-text-100">{newValue || oldValue || "Untitled page"}</span>
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
            updated project identifier to <span className="font-medium text-custom-text-100">{newValue || "none"}</span>
          </>
        ),
      };
    case "timezone":
      return {
        message: (
          <>
            changed project timezone to{" "}
            <span className="font-medium text-custom-text-100">{newValue || "default"}</span>
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
