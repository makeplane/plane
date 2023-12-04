import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CommentCard, AddComment } from "components/issues/peek-overview";
// ui
import { Icon } from "components/ui";
import { Button } from "@plane/ui";
// types
import { IIssue } from "types/issue";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer(() => {
  // router
  const router = useRouter();
  const { workspace_slug } = router.query;
  // store
  const {
    issueDetails: issueDetailStore,
    project: projectStore,
    user: { currentUser },
  } = useMobxStore();
  const comments = issueDetailStore.details[issueDetailStore.peekId || ""]?.comments || [];

  return (
    <div className="pb-10">
      <h4 className="font-medium">Activity</h4>
      {workspace_slug && (
        <div className="mt-4">
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentCard key={comment.id} comment={comment} workspaceSlug={workspace_slug?.toString()} />
            ))}
          </div>
          {currentUser ? (
            <>
              {projectStore.deploySettings?.comments && (
                <div className="mt-4">
                  <AddComment disabled={!currentUser} />
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-2 rounded border border-custom-border-300 bg-custom-background-80 px-2 py-2.5">
              <p className="flex gap-2 overflow-hidden break-words text-sm text-custom-text-200">
                <Icon iconName="lock" className="!text-sm" />
                Sign in to add your comment
              </p>
              <Link href={`/?next_path=${router.asPath}`}>
                <Button variant="primary">Sign in</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
