import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon } from "lucide-react";
import { FilledCheck, FilledCross } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EExecutionStatus } from "@/plane-web/types";
import { getIcon, PreviewBlock } from "./preview-block";

type TProps = {
  status: EExecutionStatus | undefined;
  summary:
    | {
        completed: number;
        duration_seconds: number;
        failed: number;
        total_planned: number;
      }
    | undefined;

  query_id: string;
  chatId: string;
};

export const SummaryBlock = observer((props: TProps) => {
  // props
  const { summary, query_id, chatId, status } = props;
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store
  const { getGroupedArtifactsByDialogue } = usePiChat();
  // derived
  const groupedArtifacts = getGroupedArtifactsByDialogue(chatId, query_id);
  // handlers
  const getSummary = () => {
    if (!summary) return "";
    if (summary.completed === summary.total_planned) {
      return "Action successfully completed";
    } else if (summary.failed === summary.total_planned) {
      return "Action failed";
    } else {
      return "Action partially completed";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-custom-background-90  border-custom-border-200 transition-all duration-500 ease-in-out border-[0.5px]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          "m-3 flex items-center justify-between gap-2 transition-all duration-500 ease-in-out hover:border-transparent"
        )}
      >
        {status === EExecutionStatus.EXECUTING ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 rounded-[1px] bg-black animate-vertical-scale" />
            <div className="flex gap-2 items-center shimmer">Taking required actions</div>{" "}
          </div>
        ) : (
          <div className="font-medium">{getSummary()}</div>
        )}
        <ChevronDownIcon
          className={`size-3 text-custom-text-300 transition-transform duration-500 ease-in-out ${isOpen ? "transform rotate-180" : ""}`}
        />
      </button>
      {summary && (
        <div
          className={cn(
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",

            isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 mt-0"
          )}
        >
          <div className="m-4 mt-0">
            {groupedArtifacts.successful.length > 0 && (
              <div className="flex flex-col relative items-start gap-2 border-l-2 border-custom-border-200 pl-4 pb-4">
                <div className="p-1 bg-custom-background-90 absolute top-0 -left-3 rounded-full flex items-center justify-center">
                  <FilledCheck width={16} height={16} className="text-green-500" />
                </div>
                <div className="text-base">
                  {summary.completed} successful {summary.completed > 1 ? "actions" : "action"}{" "}
                </div>
                <div className="grid grid-cols-3 gap-2 flex-wrap w-full">
                  {groupedArtifacts.successful.map((artifact) => (
                    <PreviewBlock
                      key={artifact.artifact_id}
                      url={artifact.entity_url}
                      type={artifact.artifact_type}
                      name={
                        artifact.parameters?.name ||
                        (artifact.artifact_type === "project" && artifact.parameters?.project?.name) ||
                        "Unknown"
                      }
                      data={artifact}
                    />
                  ))}
                </div>
              </div>
            )}
            {groupedArtifacts.failed.length > 0 && (
              <div className="flex flex-col relative items-start gap-2 border-l-2 border-custom-border-200 pl-4">
                <div className="p-1 bg-custom-background-90 absolute top-0 -left-3 rounded-full flex items-center justify-center">
                  <FilledCross width={16} height={16} />
                </div>
                <div className="text-base">
                  {summary.failed} failed {summary.failed > 1 ? "actions" : "action"}
                </div>
                <div className="flex flex-col gap-3 text-xs text-custom-text-300">
                  {groupedArtifacts.failed.map((artifact) => (
                    <div className="flex items-center gap-2" key={artifact.artifact_id}>
                      <div>{getIcon(artifact.artifact_type, "", "text")}</div>
                      <div className="text-sm font-medium line-clamp-2 text-start text-custom-text-300">
                        {artifact.parameters?.name || "Unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
