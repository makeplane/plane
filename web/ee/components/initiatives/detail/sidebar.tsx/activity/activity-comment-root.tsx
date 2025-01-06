import { FC } from "react";
import { observer } from "mobx-react";
// plane web constants
import { TActivityFilters, filterActivityOnSelectedFilters } from "@/plane-web/constants/issues";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeComment, TInitiativeActivity, TInitiativeActivityComment } from "@/plane-web/types/initiative";
//
import { TInitiativeActivityOperations } from "../comments";
import { InitiativeCommentCard } from "../comments/comment-card";
import { InitiativeActivityItem } from "./";

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  initiativeId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TInitiativeActivityOperations;
  disabled?: boolean;
};

export const InitiativeActivityCommentRoot: FC<TIssueActivityCommentRoot> = observer((props) => {
  const { workspaceSlug, initiativeId, selectedFilters, activityOperations, disabled } = props;
  // hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityCommentByIssueId },
    },
  } = useInitiatives();

  const activityComments = getActivityCommentByIssueId(initiativeId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, selectedFilters);

  return (
    <div>
      {filteredActivityComments.map((activityComment, index) => {
        const currActivityComment = activityComment as TInitiativeActivityComment;

        return currActivityComment.activity_type === "COMMENT" ? (
          <InitiativeCommentCard
            key={currActivityComment.id}
            initiativeId={initiativeId}
            workspaceSlug={workspaceSlug}
            comment={currActivityComment.detail as TInitiativeComment}
            activityOperations={activityOperations}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
            disabled={disabled}
          />
        ) : currActivityComment.activity_type === "ACTIVITY" ? (
          <InitiativeActivityItem
            key={currActivityComment.id}
            activity={currActivityComment.detail as TInitiativeActivity}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
