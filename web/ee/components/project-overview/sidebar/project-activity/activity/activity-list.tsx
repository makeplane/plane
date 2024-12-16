import { FC } from "react";
import { observer } from "mobx-react";
// local components
import {
  ProjectDefaultActivity,
  ProjectNameActivity,
  ProjectDescriptionActivity,
  ProjectStateActivity,
  ProjectAssigneeActivity,
  ProjectPriorityActivity,
  ProjectEstimateActivity,
  ProjectParentActivity,
  ProjectStartDateActivity,
  ProjectTargetDateActivity,
  ProjectCycleActivity,
  ProjectModuleActivity,
  ProjectLabelActivity,
  ProjectLinkActivity,
  ProjectAttachmentActivity,
  ProjectArchivedAtActivity,
  ProjectInboxActivity,
} from "./actions";

type TProjectActivityItem = {
  activity: {
    field: string | null;
    verb: string;
  };
  ends: "top" | "bottom" | undefined;
};

export const ProjectActivityItem: FC<TProjectActivityItem> = observer((props) => {
  const { activity, ends } = props;

  const componentDefaultProps = { activity, ends };

  switch (activity.field) {
    case null: // default project creation
      return <ProjectDefaultActivity {...componentDefaultProps} />;
    case "state":
      return <ProjectStateActivity {...componentDefaultProps} showProject={false} />;
    case "name":
      return <ProjectNameActivity {...componentDefaultProps} />;
    case "description":
      return <ProjectDescriptionActivity {...componentDefaultProps} showProject={false} />;
    case "assignees":
      return <ProjectAssigneeActivity {...componentDefaultProps} showProject={false} />;
    case "priority":
      return <ProjectPriorityActivity {...componentDefaultProps} showProject={false} />;
    case "estimate_point":
      return <ProjectEstimateActivity {...componentDefaultProps} showProject={false} />;
    case "parent":
      return <ProjectParentActivity {...componentDefaultProps} showProject={false} />;
    case "start_date":
      return <ProjectStartDateActivity {...componentDefaultProps} showProject={false} />;
    case "target_date":
      return <ProjectTargetDateActivity {...componentDefaultProps} showProject={false} />;
    case "cycles":
      return <ProjectCycleActivity {...componentDefaultProps} />;
    case "modules":
      return <ProjectModuleActivity {...componentDefaultProps} />;
    case "labels":
      return <ProjectLabelActivity {...componentDefaultProps} showProject={false} />;
    case "link":
      return <ProjectLinkActivity {...componentDefaultProps} showProject={false} />;
    case "attachment":
      return <ProjectAttachmentActivity {...componentDefaultProps} showProject={false} />;
    case "archived_at":
      return <ProjectArchivedAtActivity {...componentDefaultProps} />;
    case "inbox":
      return <ProjectInboxActivity {...componentDefaultProps} />;
    default:
      return <></>;
  }
});
