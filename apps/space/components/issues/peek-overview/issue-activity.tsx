import React, { useEffect } from "react";
// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

import { CommentCard, AddComment } from "components/issues/peek-overview";

type Props = {
  workspaceSlug: string;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer((props) => {
  const { workspaceSlug } = props;

  const { issue: issueStore, user: userStore } = useMobxStore();

  const issueId = issueStore?.activePeekOverviewIssueId;
  const comments = issueStore?.issue_detail[issueId ?? ""]?.comments ?? [];

  useEffect(() => {
    if (userStore.currentUser) return;

    userStore.getUserAsync();
  }, [userStore]);

  return (
    <div>
      <h4 className="font-medium">Activity</h4>

      <div className="mt-4">
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard comment={comment} workspaceSlug={workspaceSlug} />
          ))}
        </div>
        <div className="mt-4">
          <AddComment disabled={!userStore.currentUser} issueId={issueId} />
        </div>
      </div>
    </div>
  );
});
