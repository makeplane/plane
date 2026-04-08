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
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
// plane imports
import { cn, Loader } from "@plane/ui";
// plane-web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import ActionStatusBlock from "@/components/pi-chat/actions/action-status-block";
import { PiChatArtifactsListRoot } from "@/components/pi-chat/actions/artifacts/list/root";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TDialogue } from "@/types";
// local imports
import { Feedback } from "./feedback";
import { JsonRenderPreBlock } from "@/components/common/json-renderer/pi-chat-registry";
import { ReasoningBlock } from "./reasoning";

type TProps = {
  id?: string;
  dialogue?: TDialogue;
  isLatest?: boolean;
  isLoading?: boolean;
  handleConvertToPage?: () => void;
};
export const AiMessage = observer(function AiMessage(props: TProps) {
  // props
  const { dialogue, id = "", isLatest, isLoading, handleConvertToPage } = props;
  // store
  const { workspaceSlug } = useParams();
  const { activeChatId, isPiTyping } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;
  const { query_id, answer, reasoning, isPiThinking, feedback, current_tick, todos } = dialogue || {};

  return (
    <div className="flex gap-4" id={id}>
      <div className="flex flex-col text-14 break-words w-full">
        {/* Message */}
        <div className="flex flex-col">
          {!isLoading && (
            <ReasoningBlock reasoning={reasoning} isThinking={isPiThinking} currentTick={current_tick} todos={todos} />
          )}
          <Markdown
            remarkPlugins={[remarkGfm]}
            className="pi-chat-root [&>*:first-child]:mt-0 animate-fade-in text-body-sm-regular text-primary"
            components={{
              a: ({ children, href }) => (
                <a href={href || ""} target="_blank" rel="noopener noreferrer" className="text-accent-secondary">
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-3 w-full overflow-x-auto">
                  <table className="w-full border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="min-w-32 border-0 px-3 py-2 text-left">{children}</th>,
              td: ({ children }) => <td className="border-0 px-3 pt-3 text-left">{children}</td>,
              pre: JsonRenderPreBlock,
            }}
          >
            {answer}
          </Markdown>
        </div>
        {isLoading && (
          <Loader>
            <Loader.Item width="50px" height="42px" />
          </Loader>
        )}
        {dialogue && (
          <div className={cn("flex flex-col gap-4", { "mt-4": !answer })}>
            {/* Artifacts list */}
            {dialogue.actions && <PiChatArtifactsListRoot artifacts={dialogue.actions} />}
            {/* Action bar */}
            <ActionStatusBlock
              workspaceSlug={workspaceSlug?.toString()}
              dialogue={dialogue}
              isLatest={isLatest}
              isPiTyping={isPiTyping}
              isPiThinking={isPiThinking}
              workspaceId={workspaceId}
              query_id={query_id}
              activeChatId={activeChatId}
            />
          </div>
        )}

        {/* Feedback bar */}
        {answer && (
          <Feedback
            answer={answer}
            activeChatId={activeChatId}
            id={id}
            workspaceId={workspaceId}
            feedback={feedback}
            queryId={query_id}
            isLatest={!!isLatest}
            handleConvertToPage={handleConvertToPage}
          />
        )}
      </div>
    </div>
  );
});
