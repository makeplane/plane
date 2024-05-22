import React from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@plane/ui";
// components
import { CommentCard, AddComment } from "@/components/issues/peek-overview";
import { Icon } from "@/components/ui";
// hooks
import { useIssueDetails, useProject, useUser } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";
// types
import { IIssue } from "@/types/issue";

type Props = {
  issueDetails: IIssue;
  workspaceSlug: string;
  projectId: string;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // router
  const pathname = usePathname();
  // store
  const { canComment } = useProject();
  const { details, peekId } = useIssueDetails();
  const { data: currentUser } = useUser();
  const isInIframe = useIsInIframe();

  const comments = details[peekId || ""]?.comments || [];

  return (
    <div className="pb-10">
      <h4 className="font-medium">Comments</h4>
      {workspaceSlug && (
        <div className="mt-4">
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentCard key={comment.id} comment={comment} workspaceSlug={workspaceSlug?.toString()} />
            ))}
          </div>
          {!isInIframe &&
            (currentUser ? (
              <>
                {canComment && (
                  <div className="mt-4">
                    <AddComment disabled={!currentUser} workspaceSlug={workspaceSlug} projectId={projectId} />
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-2 rounded border border-custom-border-300 bg-custom-background-80 px-2 py-2.5">
                <p className="flex gap-2 overflow-hidden break-words text-sm text-custom-text-200">
                  <Icon iconName="lock" className="!text-sm" />
                  Sign in to add your comment
                </p>
                <Link href={`/?next_path=${pathname}`}>
                  <Button variant="primary">Sign in</Button>
                </Link>
              </div>
            ))}
        </div>
      )}
    </div>
  );
});
