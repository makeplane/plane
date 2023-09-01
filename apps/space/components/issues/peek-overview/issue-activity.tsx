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
import { Icon, PrimaryButton } from "components/ui";
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

  const user = userStore?.currentUser;

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
          {user ? (
            <>
              {projectStore.deploySettings?.comments && (
                <div className="mt-4">
                  <AddComment disabled={!userStore.currentUser} />
                </div>
              )}
            </>
          ) : (
            <div className="bg-custom-background-80 px-2 py-2.5 flex items-center justify-between gap-2 border border-custom-border-300 rounded mt-4">
              <p className="flex gap-2 text-sm text-custom-text-200 break-words overflow-hidden">
                <Icon iconName="lock" className="!text-sm" />
                Sign in to add your comment
              </p>
              <Link href={`/?next_path=${router.asPath}`}>
                <a>
                  <PrimaryButton className="flex-shrink-0 !px-7">Sign in</PrimaryButton>
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
