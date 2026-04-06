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

import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
import { SmilePlus } from "lucide-react";
import type { ReactionChip } from "../types";

export type CommentActionsProps = {
  onReply?: () => void;
  reactions?: ReactionChip[];
  onAddReaction?: () => void;
};

export function CommentActions(props: CommentActionsProps) {
  const { onReply, reactions, onAddReaction } = props;

  return (
    <div className="flex items-center gap-1.5">
      {onReply && (
        <Button variant="ghost" size="sm" onClick={onReply}>
          Reply
        </Button>
      )}
      {onReply && (reactions?.length || onAddReaction) && <div className="h-3 border-l border-subtle" />}
      {reactions?.map((reaction) => (
        <button
          key={reaction.id}
          aria-label={`React with ${reaction.id}`}
          type="button"
          className={cn(
            "flex h-5 items-center gap-1 rounded-sm bg-layer-3 px-1.5 text-caption-md-medium text-secondary",
            reaction.isActive && "border border-accent-primary"
          )}
          onClick={reaction.onClick}
        >
          <span className="flex size-3.5 items-center justify-center">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      {onAddReaction && (
        <IconButton variant="tertiary" size="sm" icon={SmilePlus} iconClassName="size-3" onClick={onAddReaction} />
      )}
    </div>
  );
}
