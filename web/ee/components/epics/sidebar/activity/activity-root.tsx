import { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TActivityOperations } from "@/components/issues";
import { TSORT_ORDER } from "@/constants/common";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
// plane web constants
import { IssueActivityWorklog } from "@/plane-web/components/issues";
import { TActivityFilters, filterActivityOnSelectedFilters } from "@/plane-web/constants/issues";
import { IssueActivityItem } from "../../epic-detail/activity";
import { IssueAdditionalPropertiesActivity } from "../../epic-detail/custom-properties-activity";
import { EpicCommentCard } from "./comments/card";
// components

type TIssueActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  selectedFilters: TActivityFilters[];
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const EpicActivityCommentRoot: FC<TIssueActivityCommentRoot> = observer((props) => {
  const { workspaceSlug, issueId, selectedFilters, activityOperations, showAccessSpecifier, projectId, disabled } =
    props;
  // hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activityComments = getActivityCommentByIssueId(issueId, TSORT_ORDER.ASC);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, selectedFilters);

  return (
    <div>
      {filteredActivityComments.map((activityComment, index) =>
        activityComment.activity_type === "COMMENT" ? (
          <EpicCommentCard
            projectId={projectId}
            key={activityComment.id}
            workspaceSlug={workspaceSlug}
            commentId={activityComment.id}
            activityOperations={activityOperations}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
            showAccessSpecifier={showAccessSpecifier}
            disabled={disabled}
          />
        ) : activityComment.activity_type === "ACTIVITY" ? (
          <IssueActivityItem
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY" ? (
          <IssueAdditionalPropertiesActivity
            activityId={activityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : activityComment.activity_type === "WORKLOG" ? (
          <IssueActivityWorklog
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            activityComment={activityComment}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        )
      )}
    </div>
  );
});
