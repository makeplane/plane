import { useState } from "react";
import { Info } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EExecutionStatus, TDialogue } from "@/plane-web/types";
import { ConfirmBlock } from "./confirm-block";
import { SummaryBlock } from "./summary";

type TProps = {
  isLatest: boolean | undefined;
  isPiThinking: boolean | undefined;
  workspaceId: string | undefined;
  query_id: string | undefined;
  activeChatId: string;
  isPiTyping: boolean;
  dialogue: TDialogue;
};

const ActionStatusBlock = (props: TProps) => {
  // props
  const { isLatest, isPiThinking, workspaceId, query_id, activeChatId, isPiTyping, dialogue } = props;
  const { execution_status, action_summary, actions } = dialogue;
  // states
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  // store
  const { executeAction } = usePiChat();
  // handlers
  const handleExecuteAction = async (workspaceId: string, query_id: string) => {
    try {
      setIsExecutingAction(true);
      await executeAction(workspaceId, activeChatId, query_id);
    } catch (e: any) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Action failed!",
        message: e?.detail,
      });
    } finally {
      setIsExecutingAction(false);
    }
  };
  if (actions?.length === 0 || !query_id) return null;
  if (execution_status === "pending") {
    if (isPiThinking || (isLatest && isPiTyping)) return null;
    if (isLatest) {
      return (
        <ConfirmBlock
          summary="Please confirm the actions you want to execute"
          isExecutingAction={isExecutingAction}
          handleExecuteAction={handleExecuteAction}
          workspaceId={workspaceId}
          query_id={query_id}
        />
      );
    } else
      return (
        <div className="flex gap-2 text-custom-text-400 text-sm">
          <Info size={16} className="my-auto" />
          <div> {actions?.length} action(s) not executed </div>
        </div>
      );
  }
  if (action_summary && action_summary?.completed + action_summary?.failed !== actions?.length)
    return (
      <div className="flex gap-2 text-custom-text-400 text-sm">
        <Info size={16} className="my-auto" />
        <div> {actions?.length} action(s) not executed </div>
      </div>
    );
  // Render summary if execution status is executing or action summary is present
  return (
    (execution_status === EExecutionStatus.EXECUTING || action_summary) && (
      <SummaryBlock
        summary={dialogue.action_summary}
        chatId={activeChatId}
        status={execution_status}
        query_id={query_id}
      />
    )
  );
};

export default ActionStatusBlock;
