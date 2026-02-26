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

import { useState } from "react";
import { observer } from "mobx-react";
import { FilePlus2, ThumbsDown, ThumbsUp, Repeat2 } from "lucide-react";
import { CopyIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/ui";
import { Tooltip } from "@plane/propel/tooltip";
import { copyTextToClipboard } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { FeedbackModal } from "../input/feedback-modal";
import { EAiFeedback } from "@plane/types";

export type TProps = {
  answer: string;
  activeChatId: string;
  id: string;
  workspaceId: string | undefined;
  feedback: EAiFeedback | undefined;
  queryId: string | undefined;
  isLatest: boolean;
  handleConvertToPage?: () => void;
};

export const Feedback = observer(function Feedback(props: TProps) {
  // props
  const { answer, activeChatId, id, workspaceId, feedback, queryId, isLatest, handleConvertToPage } = props;
  // states
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // store
  const { isWorkspaceAuthorized, sendFeedback, regenerateAnswer } = usePiChat();
  // handlers
  const handleCopyLink = () => {
    void copyTextToClipboard(answer).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Response copied!",
        message: "Response to clipboard.",
      });
      return;
    });
  };
  const handleFeedback = async (feedback: EAiFeedback, feedbackMessage?: string) => {
    try {
      await sendFeedback(activeChatId, parseInt(id), feedback, workspaceId, feedbackMessage);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Feedback sent!",
        message: "Feedback sent!",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Feedback failed!",
        message: "Feedback failed!",
      });
    }
  };
  const handleRewrite = async () => {
    try {
      if (!queryId || !workspaceId) return;
      await regenerateAnswer(activeChatId, queryId, workspaceId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex gap-4 mt-2">
      {/* Copy */}
      <Tooltip tooltipContent="Copy to clipboard" position="bottom" className="mb-4">
        <CopyIcon
          height={16}
          width={16}
          onClick={handleCopyLink}
          className="my-auto cursor-pointer text-icon-secondary"
        />
      </Tooltip>

      {/* Good response */}
      {(!feedback || feedback === EAiFeedback.POSITIVE) && (
        <Tooltip tooltipContent="Good response" position="bottom" className="mb-4">
          <button
            className={cn({
              "cursor-default": feedback === EAiFeedback.POSITIVE,
            })}
            onClick={() => {
              if (!feedback) void handleFeedback(EAiFeedback.POSITIVE);
            }}
          >
            <ThumbsUp
              size={16}
              fill={feedback === EAiFeedback.POSITIVE ? "currentColor" : "none"}
              className="my-auto text-icon-secondary transition-colors	"
            />
          </button>
        </Tooltip>
      )}

      {/* Bad response */}
      {(!feedback || feedback === EAiFeedback.NEGATIVE) && (
        <Tooltip tooltipContent="Bad response" position="bottom" className="mb-4">
          <button
            className={cn({
              "!cursor-default": feedback === EAiFeedback.NEGATIVE,
            })}
            onClick={() => !feedback && setIsFeedbackModalOpen(true)}
          >
            <ThumbsDown
              size={16}
              fill={feedback === EAiFeedback.NEGATIVE ? "currentColor" : "none"}
              className="my-auto text-icon-secondary transition-colors	"
            />
          </button>
        </Tooltip>
      )}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={(feedbackMessage) => void handleFeedback(EAiFeedback.NEGATIVE, feedbackMessage)}
      />

      {/* Rewrite */}
      {isLatest && (
        <Tooltip tooltipContent="Rewrite" position="bottom" className="mb-4">
          <button onClick={() => void handleRewrite()}>
            <Repeat2 strokeWidth={1.5} size={20} className="my-auto text-icon-secondary transition-colors" />
          </button>
        </Tooltip>
      )}

      {/* Convert to page */}
      <div className="flex text-13 font-medium gap-1 cursor-pointer">
        <Tooltip
          tooltipContent={isWorkspaceAuthorized ? "Convert to page" : "Authorize workspace to convert to page"}
          position="bottom"
          className="mb-4"
        >
          <button onClick={() => isWorkspaceAuthorized && handleConvertToPage?.()}>
            <FilePlus2
              size={16}
              className={cn("my-auto text-icon-secondary transition-colors", {
                "cursor-not-allowed text-placeholder": !isWorkspaceAuthorized,
              })}
            />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
