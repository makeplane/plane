import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
// plane imports
import { PI_BASE_URL } from "@plane/constants";
import { Loader, PiIcon } from "@plane/ui";
// plane-web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TDialogue } from "@/plane-web/types";
// local imports
import ActionStatusBlock from "./action-status-block";
import { Feedback } from "./feedback";
import { ReasoningBlock } from "./reasoning";

type TProps = {
  id: string;
  dialogue?: TDialogue;
  isLatest?: boolean;
  isLoading?: boolean;
};
export const AiMessage = observer((props: TProps) => {
  // props
  const { dialogue, id, isLatest, isLoading } = props;
  // store
  const { workspaceSlug } = useParams();
  const { activeChatId, isPiTyping } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id;
  const { query_id, answer, reasoning, isPiThinking, feedback, execution_status } = dialogue || {};

  return (
    <div className="flex gap-4 mr-[50px]" id={id}>
      {/* Avatar */}
      <div className="rounded-full flex flex-shrink-0 my-1">
        <PiIcon className="size-5 text-custom-text-primary fill-current align-center" />
      </div>
      <div className="flex flex-col text-base break-words w-full">
        {/* Message */}
        <div className="flex flex-col gap-4">
          {!isLoading && <ReasoningBlock reasoning={reasoning} showLoading={isPiThinking} />}
          <Markdown
            remarkPlugins={[remarkGfm]}
            className="pi-chat-root [&>*:first-child]:mt-0"
            components={{
              a: ({ children, href }) =>
                href?.startsWith(`${PI_BASE_URL}/api/v1/oauth/authorize/`) && !isLatest ? ( // NOTE: Prev auth links shouldn't be accessible
                  <span className="!underline !text-custom-text-350">{children}</span>
                ) : (
                  <a href={href || ""} rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              table: ({ children }) => (
                <div className="overflow-x-auto w-full my-4 border-custom-border-200">
                  <table className="min-w-full border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="px-2 py-3 border-custom-border-200">{children}</th>,
              td: ({ children }) => <td className="px-2 py-3 border-custom-border-200">{children}</td>,
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

        {/* Action bar */}
        <ActionStatusBlock
          execution_status={execution_status}
          isLatest={isLatest}
          isPiTyping={isPiTyping}
          isPiThinking={isPiThinking}
          workspaceId={workspaceId}
          query_id={query_id}
          activeChatId={activeChatId}
        />

        {/* Feedback bar */}
        {answer && (
          <Feedback answer={answer} activeChatId={activeChatId} id={id} workspaceId={workspaceId} feedback={feedback} />
        )}
      </div>
    </div>
  );
});
