import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TEntity, TActions, TExecutionStatus } from "@/plane-web/types";

const ACTION_STATUS_ICON = {
  success: "✅",
  failed: "❌",
  partial: "⚠️",
};

type TProps = {
  execution_status: TActions | undefined;
  isLatest: boolean | undefined;
  isPiThinking: boolean | undefined;
  workspaceId: string | undefined;
  query_id: string | undefined;
  activeChatId: string;
  isPiTyping: boolean;
};

const ActionStatusBlock = (props: TProps) => {
  // props
  const { execution_status, isLatest, isPiThinking, workspaceId, query_id, activeChatId, isPiTyping } = props;
  // states
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionStatus, setActionStatus] = useState<
    | {
        status: TExecutionStatus;
        message: string;
        entities: TEntity[];
      }
    | undefined
  >();
  // store
  const { executeAction } = usePiChat();
  // handlers
  const handleExecuteAction = async (workspaceId: string, query_id: string) => {
    try {
      setIsExecutingAction(true);
      const response = await executeAction(workspaceId, activeChatId, query_id);
      if (!response) return;
      setActionStatus({
        status: response.status,
        message: response.message,
        entities: response.actions
          ?.filter((action) => action.entity)
          .map((action) => ({
            entity_type: action.entity?.entity_type,
            entity_url: action.entity?.entity_url,
            entity_name: action.entity?.entity_name,
            entity_id: action.entity?.entity_id,
          })),
      });
      response?.actions?.forEach((action) => {
        setToast({
          type: action.success ? TOAST_TYPE.SUCCESS : TOAST_TYPE.ERROR,
          title: action.success ? "Action successful!" : "Action failed!",
          message: action.success ? action.message : action.error,
          actionItems: action.success && action.entity && (
            <Link
              href={action.entity?.entity_url || ""}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-custom-primary py-1 hover:bg-custom-background-90 font-medium pl-2"
            >
              View {action.entity?.entity_type}
            </Link>
          ),
        });
      });
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

  // render
  if (execution_status?.actions_count === 0 || !query_id) return null;
  if (execution_status?.status === "pending") {
    if (isPiThinking || (isLatest && isPiTyping)) return null;
    if (isLatest) {
      return (
        <div className="flex gap-4">
          <Button
            disabled={isExecutingAction}
            onClick={() => handleExecuteAction(workspaceId?.toString() || "", query_id)}
          >
            Confirm
          </Button>
        </div>
      );
    } else
      return (
        <div className="flex gap-2 text-custom-text-400 text-sm">
          <Info size={16} className="my-auto" />
          <div> {execution_status?.actions_count} action(s) not executed </div>
        </div>
      );
  }

  const actions =
    actionStatus?.entities ||
    execution_status?.actions?.filter((action) => action.entity).map((action) => action.entity);
  const status = actionStatus?.status || execution_status?.status;
  const message = actionStatus?.message || execution_status?.message;

  return (
    message && (
      <div className="pi-chat-root">
        <hr />
        <p>
          <strong>Action Execution Status</strong>: {message}{" "}
          {ACTION_STATUS_ICON[status as keyof typeof ACTION_STATUS_ICON]}
        </p>
        {actions && actions.length > 0 && (
          <p>
            <strong>Created/Updated Entities:</strong>
            <ul>
              {actions.map((entity) => (
                <li key={entity.entity_id}>
                  <strong className="capitalize">{entity.entity_type}: </strong>
                  <Link target="_blank" href={entity.entity_url || ""} rel="noopener noreferrer">
                    {entity.entity_name}
                  </Link>
                </li>
              ))}
            </ul>
          </p>
        )}
      </div>
    )
  );
};

export default ActionStatusBlock;
