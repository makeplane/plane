import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CommentCard, AddComment } from "components/issues/peek-overview";
// types
import { IIssue } from "types";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer((props) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { issueDetails: issueDetailStore, user: userStore } = useMobxStore();

  const issueId = issueDetailStore?.peekId;
  const comments = issueDetailStore?.details[issueId ?? ""]?.comments ?? [];

  return (
    <div>
      <h4 className="font-medium">Activity</h4>
      {workspaceSlug && (
        <div className="mt-4">
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentCard comment={comment} workspaceSlug={workspaceSlug?.toString()} />
            ))}
          </div>
          <div className="mt-4">
            <AddComment disabled={!userStore.currentUser} issueId={issueId} />
          </div>
        </div>
      )}
    </div>
  );
});
