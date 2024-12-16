import { FC } from "react";
import { observer } from "mobx-react";
// icons
import { Users } from "lucide-react";
// Plane
import { TInitiativeActivity } from "@/plane-web/types/initiative";
// hooks;
import { useWorkspace } from "@/hooks/store";
// components
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeAssigneeActivity = {
  activity: TInitiativeActivity;
  ends: "top" | "bottom" | undefined;
};

export const InitiativeLeadActivity: FC<TInitiativeAssigneeActivity> = observer((props) => {
  const { activity, ends } = props;
  // hooks
  const { getWorkspaceById } = useWorkspace();
  if (!activity) return <></>;
  const workspaceDetail = getWorkspaceById(activity.workspace);

  return (
    <InitiativeActivityBlockComponent
      icon={<Users className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}
      <a
        href={`/${workspaceDetail?.slug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center font-medium text-custom-text-100 hover:underline capitalize"
      >
        {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
      </a>
    </InitiativeActivityBlockComponent>
  );
});
