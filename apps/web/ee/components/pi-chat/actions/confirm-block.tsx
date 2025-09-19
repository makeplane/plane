import { Button } from "@plane/ui";

type TProps = {
  summary: string;
  isExecutingAction: boolean;
  workspaceId: string | undefined;
  query_id: string;
  handleExecuteAction: (workspaceId: string, query_id: string) => void;
};

export const ConfirmBlock = (props: TProps) => {
  const { summary, isExecutingAction, handleExecuteAction, workspaceId, query_id } = props;
  return (
    <div className="flex flex-col gap-2 border-[0.5px] border-custom-border-200 rounded-xl bg-custom-background-90 p-3">
      <div className="font-semibold text-base">Awaiting response</div>
      <div className="text-custom-text-350 text-sm font-medium">{summary}</div>
      <Button
        disabled={isExecutingAction}
        onClick={() => handleExecuteAction(workspaceId?.toString() || "", query_id)}
        className="w-fit"
      >
        Confirm
      </Button>
    </div>
  );
};
