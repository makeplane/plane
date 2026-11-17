/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Link } from "react-router";
import { usePathname } from "next/navigation";
import { LockOutline } from "@makeplane/propel/icons";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
// components
import { AddComment } from "@/components/issues/peek-overview/comment/add-comment";
import { CommentCard } from "@/components/issues/peek-overview/comment/comment-detail-card";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
import useIsInIframe from "@/hooks/use-is-in-iframe";
// types
import type { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  issueDetails: IIssue;
};

export const PeekOverviewIssueActivity = observer(function PeekOverviewIssueActivity(props: Props) {
  const { anchor } = props;
  // i18n
  const { t } = useTranslation();
  // router
  const pathname = usePathname();
  // store hooks
  const { details, peekId } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { canComment } = usePublish(anchor);
  // derived values
  // newest first, with the composer above the thread
  const storedComments = details[peekId || ""]?.comments ?? [];
  const comments = storedComments.map((_, index) => storedComments[storedComments.length - 1 - index]);
  const isInIframe = useIsInIframe();

  return (
    <div className="pb-10">
      <h4 className="text-body-sm-medium">{t("common.comments")}</h4>
      <div className="mt-4">
        {!isInIframe &&
          (currentUser ? (
            <>
              {canComment && (
                <div className="mb-4">
                  <AddComment anchor={anchor} disabled={!currentUser} />
                </div>
              )}
            </>
          ) : (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-sm border border-strong bg-layer-2 px-2 py-2.5">
              <p className="flex items-center gap-2 overflow-hidden text-body-xs-regular break-words text-secondary">
                <LockOutline className="size-3 shrink-0" />
                Sign in to add your comment
              </p>
              <Button
                variant="primary"
                size="sm"
                stretch="auto"
                nativeButton={false}
                render={<Link to={`/?next_path=${pathname}`} />}
                label="Sign in"
              />
            </div>
          ))}
        <div>
          {comments.map((comment, index) => (
            <CommentCard
              key={comment.id}
              anchor={anchor}
              comment={comment}
              showConnector={index !== comments.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
