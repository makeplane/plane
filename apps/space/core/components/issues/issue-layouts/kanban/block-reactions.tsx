/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane utils
import { cn } from "@plane/utils";
// components
import { IssueEmojiReactions } from "@/components/issues/reactions/issue-emoji-reactions";
import { IssueVotes } from "@/components/issues/reactions/issue-vote-reactions";
// hooks
import { usePublish } from "@/hooks/store/publish";

type Props = {
  issueId: string;
};
export const BlockReactions = observer(function BlockReactions(props: Props) {
  const { issueId } = props;
  const { anchor } = useParams();
  const { canVote, canReact } = usePublish(anchor.toString());

  // if the user cannot vote or react then return empty
  if (!canVote && !canReact) return <></>;

  return (
    <div className="flex flex-wrap border-t-[1px] outline-transparent w-full border-t-subtle-1 bg-layer-2 rounded-b-lg">
      <div className="p-3 flex flex-wrap items-center gap-2">
        {canVote && (
          <div
            className={cn(`flex items-center gap-2 pr-1`, {
              "after:h-6 after:ml-1 after:w-[1px] after:bg-layer-3": canReact,
            })}
          >
            <IssueVotes anchor={anchor.toString()} issueIdFromProps={issueId} size="sm" />
          </div>
        )}
        {canReact && (
          <div className="flex flex-wrap items-center gap-2">
            <IssueEmojiReactions anchor={anchor.toString()} issueIdFromProps={issueId} />
          </div>
        )}
      </div>
    </div>
  );
});
