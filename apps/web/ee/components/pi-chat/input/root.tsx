import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArrowUp, FileText } from "lucide-react";
import { PiChatEditor } from "@plane/editor";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";
import { cn, isCommentEmpty } from "@plane/utils";
import { useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssueIdentifier } from "@/plane-web/components/issues";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { IFormattedValue, IItem, TFocus } from "@/plane-web/types";
import { FocusFilter } from "./focus-filter";
import useSWR from "swr";

type TEditCommands = {
  getHTML: () => string;
  clear: () => void;
};
type TProps = {
  isFullScreen: boolean;
  className?: string;
  activeChatId?: string;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
};

export const InputBox = observer((props: TProps) => {
  const { className, activeChatId, shouldRedirect = true, isProjectLevel = false } = props;

  // store hooks
  const {
    getAnswer,
    searchCallback,
    isPiTyping,
    isLoading: isChatLoading,
    createNewChat,
    getChatById,
    fetchModels,
  } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // router
  const { workspaceSlug, projectId } = useParams();
  const router = useAppRouter();
  // derived values
  const chat = activeChatId && getChatById(activeChatId);
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id;
  // state
  const [focus, setFocus] = useState<TFocus>({
    isInWorkspaceContext: true,
    entityType: "workspace_id",
    entityIdentifier: workspaceId || "",
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  //ref
  const isLoadingRef = useRef(false);
  const activeChatIdRef = useRef<string | undefined>(undefined);
  const focusRef = useRef<TFocus>(focus);
  const editorCommands = useRef<TEditCommands | null>(null);

  useSWR(`PI_MODELS`, () => fetchModels(), {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    errorRetryCount: 0,
  });

  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const query = editorCommands.current?.getHTML();
      if (isLoadingRef.current || !query || isCommentEmpty(query)) return;
      if (!activeChatIdRef.current) {
        isLoadingRef.current = true;
        setIsInitializing(true);
        const newChatId = await createNewChat(focusRef.current, isProjectLevel, workspaceId || "");
        activeChatIdRef.current = newChatId;
        setIsInitializing(false);
        // Don't redirect if we are in the floating chat window
        if (shouldRedirect) router.push(`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}pi-chat/${newChatId}`);
      }
      getAnswer(activeChatIdRef.current, query, focusRef.current, isProjectLevel);
      editorCommands.current?.clear();
    },
    [editorCommands, getAnswer, activeChatId]
  );

  const getMentionSuggestions = async (query: string) => {
    const response = await searchCallback(workspaceSlug.toString(), query, focusRef.current);
    return formatSearchQuery(response);
  };

  const getIcon = (type: string, item: Partial<IItem>) => {
    switch (type) {
      case "issue":
        return (
          <IssueIdentifier
            issueTypeId={item.type_id}
            projectId={item.project_id || ""}
            projectIdentifier={item.project__identifier || ""}
            issueSequenceId={item.sequence_id || ""}
            textContainerClassName="text-custom-sidebar-text-400 text-xs whitespace-nowrap"
          />
        );
      case "cycle":
        return <ContrastIcon className="w-4 h-4" />;
      case "module":
        return <DiceIcon className="w-4 h-4" />;
      case "page":
        return <FileText className="w-4 h-4" />;
      default:
        return <LayersIcon className="w-4 h-4" />;
    }
  };

  const formatSearchQuery = (data: Partial<IFormattedValue>): IFormattedValue => {
    const parsedResponse: IFormattedValue = {
      cycle: [],
      module: [],
      page: [],
      issue: [],
    };
    Object.keys(data).forEach((type) => {
      parsedResponse[type] = data[type]?.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.name,
        subTitle: type === "issue" ? `${item.project__identifier}-${item.sequence_id}` : undefined,
        icon: getIcon(type, item),
      }));
    });
    return parsedResponse;
  };

  const updateFocus = <K extends keyof TFocus>(key: K, value: TFocus[K]) => {
    setFocus((prev) => {
      const updated = { ...prev, [key]: value };
      focusRef.current = updated; // Sync ref
      return updated;
    });
  };

  useEffect(() => {
    if (chat) {
      const presentFocus = {
        isInWorkspaceContext: chat.is_focus_enabled,
        entityType: chat.focus_project_id ? "project_id" : "workspace_id",
        entityIdentifier: chat.focus_project_id || chat.focus_workspace_id,
      };
      setFocus(presentFocus);
      focusRef.current = presentFocus;
    }
  }, [isChatLoading]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    if (activeChatId === "") {
      const presentFocus = {
        isInWorkspaceContext: true,
        entityType: projectId ? "project_id" : "workspace_id",
        entityIdentifier: projectId?.toString() || workspaceId?.toString() || "",
      };
      setFocus(presentFocus);
      focusRef.current = presentFocus;
    }
  }, [activeChatId]);

  useEffect(() => {
    isLoadingRef.current = isPiTyping;
  }, [isPiTyping]);

  return (
    <form
      className={cn(
        "bg-custom-background-100 flex flex-col absolute bottom-0 left-0 px-2 pb-3 md:px-0 rounded-lg w-full",
        className
      )}
    >
      <div
        className={cn(
          "bg-custom-background-100 rounded-xl p-3 flex flex-col gap-1 shadow-sm border-[0.5px] border-custom-border-200 min-h-[120px] justify-between"
        )}
      >
        {/* Input Box */}
        <PiChatEditor
          setEditorCommand={(command) => {
            setEditorCommands({ ...command });
          }}
          handleSubmit={handleSubmit}
          mentionSuggestions={(query: string) => getMentionSuggestions(query)}
          className="flex-1"
        />
        <div className="flex w-full gap-3 justify-between">
          {/* Focus */}
          <FocusFilter focus={focus} setFocus={updateFocus} isLoading={isChatLoading && !!activeChatId} />

          {/* Submit button */}
          <button
            className={cn("rounded-full bg-pi-700 text-white size-8 flex items-center justify-center", {
              "bg-pi-700/10 cursor-not-allowed": isPiTyping || isInitializing,
            })}
            type="submit"
            onClick={handleSubmit}
            disabled={isPiTyping || isInitializing}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <div className="text-xs text-custom-text-350 pt-2 text-center">
        Pi can make mistakes, please double-check responses.
      </div>
    </form>
  );
});
