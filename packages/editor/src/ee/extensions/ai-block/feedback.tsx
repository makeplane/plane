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

import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useEffect, useState } from "react";
import { EAiFeedback } from "@plane/types";
import type { TAIBlockHandlers } from "@plane/types";
import { Tooltip } from "@plane/propel/tooltip";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";

export const AIBlockFeedback = ({
  feedback: initialFeedback,
  blockId,
  aiBlockHandlers,
  type,
  isFlagged,
}: {
  feedback: EAiFeedback | null | undefined;
  blockId: string | null;
  aiBlockHandlers: TAIBlockHandlers | undefined;
  type: "revision" | "settings";
  isFlagged?: boolean;
}) => {
  const [feedback, setFeedback] = useState<EAiFeedback | undefined | null>(undefined);
  const handleFeedback = async (feedbackValue: EAiFeedback) => {
    const initialValue = feedback;
    try {
      if (!blockId || isFlagged) return;
      if (feedbackValue === initialValue) {
        setFeedback(undefined);
        return;
      }
      setFeedback(feedbackValue);
      await aiBlockHandlers?.postFeedback({
        usage_type: type === "revision" ? "ai_block_revision" : "ai_block",
        usage_id: blockId,
        feedback: feedbackValue,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Feedback sent!",
        message: "Feedback sent!",
      });
    } catch (error) {
      console.error(error);
      setFeedback(initialValue);
    }
  };

  useEffect(() => {
    setFeedback(initialFeedback);
  }, [initialFeedback]);
  return (
    <div className="flex items-center gap-2">
      {/* Good response */}
      {(!feedback || feedback === EAiFeedback.POSITIVE) && (
        <Tooltip tooltipContent="Good response" position="bottom" className="mb-4">
          <IconButton
            icon={ThumbsUp}
            onClick={() => {
              void handleFeedback(EAiFeedback.POSITIVE);
            }}
            variant="ghost"
            size="sm"
            className={cn({
              "text-accent-primary": feedback === EAiFeedback.POSITIVE,
            })}
          />
        </Tooltip>
      )}

      {/* Bad response */}
      {(!feedback || feedback === EAiFeedback.NEGATIVE) && (
        <Tooltip tooltipContent="Bad response" position="bottom" className="mb-4">
          <IconButton
            icon={ThumbsDown}
            onClick={() => {
              void handleFeedback(EAiFeedback.NEGATIVE);
            }}
            variant="ghost"
            size="sm"
            className={cn({
              "text-accent-primary": feedback === EAiFeedback.NEGATIVE,
            })}
          />
        </Tooltip>
      )}
    </div>
  );
};
