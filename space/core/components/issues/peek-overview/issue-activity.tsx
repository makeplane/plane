"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@plane/ui";
// components
import { CommentCard, AddComment } from "@/components/issues/peek-overview";
import { Icon } from "@/components/ui";
// hooks
import { useIssueDetails, usePublish, useUser } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";
// types
import { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  issueDetails: IIssue;
};

export const PeekOverviewIssueActivity: React.FC<Props> = observer((props) => {
  const { anchor } = props;
  // router
  const pathname = usePathname();
  // store hooks
  const { details, peekId } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { canComment } = usePublish(anchor);
  // derived values
  const comments = details[peekId || ""]?.comments || [];
  const isInIframe = useIsInIframe();

  return (
    <div className="pb-10">
      <h4 className="font-medium">Comments</h4>
      <div className="mt-4">
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard key={comment.id} anchor={anchor} comment={comment} />
          ))}
        </div>
        {!isInIframe &&
          (currentUser ? (
            <>
              {canComment && (
                <div className="mt-4">
                  <AddComment anchor={anchor} disabled={!currentUser} />
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
    </div>
  );
});
