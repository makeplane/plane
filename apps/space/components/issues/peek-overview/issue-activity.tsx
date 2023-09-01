import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CommentCard, AddComment } from "components/issues/peek-overview";
// types
import { IIssue } from "types/issue";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer((props) => {
  const router = useRouter();
  const { workspace_slug } = router.query;

  const { issueDetails: issueDetailStore, project: projectStore, user: userStore } = useMobxStore();

  const comments = issueDetailStore.details[issueDetailStore.peekId || ""]?.comments || [];

  console.log("issueDetailStore", issueDetailStore);

  return (
    <div>
      <h4 className="font-medium">Activity</h4>
      {workspace_slug && (
        <div className="mt-4">
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentCard key={comment.id} comment={comment} workspaceSlug={workspace_slug?.toString()} />
            ))}
          </div>
          {projectStore.deploySettings?.comments && (
            <div className="mt-4">
              <AddComment disabled={!userStore.currentUser} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
