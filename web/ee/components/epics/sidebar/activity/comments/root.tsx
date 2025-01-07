import { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
// components
import { TActivityOperations } from "@/components/issues";
import { TSORT_ORDER } from "@/constants/common";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web constants
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants/issues";
import { EpicCommentCard } from "./card";

type TEpicCommentActivityRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityOperations: TActivityOperations;
  showAccessSpecifier?: boolean;
  disabled?: boolean;
};

export const EpicCommentActivityRoot: FC<TEpicCommentActivityRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, activityOperations, showAccessSpecifier, disabled } = props;
  // hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activityComments = getActivityCommentByIssueId(issueId, TSORT_ORDER.ASC);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.COMMENT]);

  return (
    <div>
      {filteredActivityComments.map((activityComment, index) => (
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
      ))}
    </div>
  );
});
