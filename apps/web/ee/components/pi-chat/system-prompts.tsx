import React from "react";
import { useParams } from "next/navigation";
import { BriefcaseIcon, FileText, Loader as Spinner } from "lucide-react";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TTemplate } from "@/plane-web/types";

type TSystemPrompt = {
  prompt: TTemplate;
  isProjectLevel: boolean;
  shouldRedirect?: boolean;
  isInitializing?: boolean;
  setIsInitializing: (value: string) => void;
};
const SystemPrompts = (props: TSystemPrompt) => {
  const { prompt, isProjectLevel = false, shouldRedirect = true, isInitializing, setIsInitializing } = props;
  // store hooks
  const { getAnswer, isPiTyping, createNewChat } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // router
  const { workspaceSlug, projectId } = useParams();
  const router = useAppRouter();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() || "")?.id;

  const getIcon = (type: string) => {
    switch (type) {
      case "pages":
        return FileText;
      case "cycles":
        return ContrastIcon;
      case "modules":
        return DiceIcon;
      case "projects":
        return BriefcaseIcon;
      case "issues":
        return LayersIcon;
      default:
        return LayersIcon;
    }
  };

  const handleClick = async () => {
    setIsInitializing(prompt.text);
    const focus = {
      isInWorkspaceContext: true,
      entityType: projectId ? "project_id" : "workspace_id",
      entityIdentifier: projectId?.toString() || workspaceId?.toString() || "",
    };
    const newChatId = await createNewChat(focus, isProjectLevel, workspaceId);
    setIsInitializing("");
    // Don't redirect if we are in the floating chat window
    if (shouldRedirect) router.push(`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}pi-chat/${newChatId}`);
    getAnswer(newChatId, prompt.text, focus, isProjectLevel, workspaceSlug?.toString(), workspaceId?.toString());
  };
  const promptIcon = getIcon(prompt.type);

  return (
    <button
      className={cn(
        "bg-custom-background-90 rounded-lg flex flex-col w-[250px] p-4 gap-2 border border-transparent hover:border-custom-border-100 hover:shadow-sm",
        {
          "border-custom-border-100 shadow-sm": isPiTyping || isInitializing,
        }
      )}
      onClick={handleClick}
      disabled={isPiTyping || isInitializing}
    >
      <div className="flex items-center gap-2">
        {isInitializing ? (
          <Spinner className="size-[20px] animate-spin text-pi-400" />
        ) : (
          <span>
            {React.createElement(promptIcon, {
              className:
                prompt.type === "threads"
                  ? "size-[20px] text-pi-400 fill-current"
                  : `flex-shrink-0 size-[20px] stroke-[2] text-pi-400 stroke-current`,
            })}
          </span>
        )}
      </div>

      <span className="text-left text-sm break-words">{prompt.text}</span>
    </button>
  );
};
export default SystemPrompts;
