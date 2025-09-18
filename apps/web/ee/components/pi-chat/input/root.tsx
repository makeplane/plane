import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { ArrowUp, Disc, FileText } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EditorRefApi, PiChatEditorWithRef } from "@plane/editor";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/propel/icons";
import { cn, isCommentEmpty, joinUrlPath } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { IFormattedValue, IItem, TFocus } from "@/plane-web/types";
// local imports
import { WithFeatureFlagHOC } from "../../feature-flags";
import { FocusFilter } from "./focus-filter";
import AudioRecorder from "./voice-input";

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
  showProgress?: boolean;
};

export const InputBox = observer((props: TProps) => {
  const {
    className,
    activeChatId,
    shouldRedirect = true,
    isProjectLevel = false,
    showProgress = false,
    isFullScreen = false,
  } = props;

  // store hooks
  const {
    getAnswer,
    searchCallback,
    isPiTyping,
    isLoading: isChatLoading,
    createNewChat,
    getChatFocus,
    fetchModels,
  } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // router
  const { workspaceSlug, projectId, chatId: routeChatId } = useParams();
  const router = useRouter();
  const routerWithProgress = useAppRouter();
  // derived values
  const chatFocus = activeChatId && getChatFocus(activeChatId);
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id;
  // state
  const [focus, setFocus] = useState<TFocus>({
    isInWorkspaceContext: true,
    entityType: "workspace_id",
    entityIdentifier: workspaceId || "",
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  //ref
  const isLoadingRef = useRef(false);
  const activeChatIdRef = useRef<string | undefined>(undefined);
  const focusRef = useRef<TFocus>(focus);
  const editorCommands = useRef<TEditCommands | null>(null);
  const editorRef = useRef<EditorRefApi>(null);

  useSWR(`PI_MODELS`, () => fetchModels(workspaceId), {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    errorRetryCount: 0,
  });

  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };

  const setChatId = (chatId: string) => {
    activeChatIdRef.current = chatId;
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const query = editorCommands.current?.getHTML();
      if (isLoadingRef.current || !query || isCommentEmpty(query) || !workspaceId) return;
      if (!activeChatIdRef.current) {
        isLoadingRef.current = true;
        setIsInitializing(true);
        const newChatId = await createNewChat(focusRef.current, isProjectLevel, workspaceId);
        activeChatIdRef.current = newChatId;
        setIsInitializing(false);
      }
      // Don't redirect if we are in the floating chat window
      if (shouldRedirect && !routeChatId)
        (showProgress ? routerWithProgress : router).push(
          joinUrlPath(workspaceSlug?.toString(), isProjectLevel ? "projects" : "", "pi-chat", activeChatIdRef.current)
        );
      getAnswer(
        activeChatIdRef.current,
        query,
        focusRef.current,
        isProjectLevel,
        workspaceSlug?.toString(),
        workspaceId
      );
      editorCommands.current?.clear();
    },
    [editorCommands, getAnswer, activeChatId, shouldRedirect, routeChatId, isProjectLevel]
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
    if (chatFocus) {
      const presentFocus = {
        isInWorkspaceContext: chatFocus.isInWorkspaceContext,
        entityType: chatFocus.entityType,
        entityIdentifier: chatFocus.entityIdentifier,
      };
      setFocus(presentFocus);
      focusRef.current = presentFocus;
    }
  }, [isChatLoading]);

  useEffect(() => {
    setChatId(activeChatId || "");
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
      <div className={cn("bg-custom-background-90 rounded-xl transition-[max-height] duration-100 max-h-[250px]")}>
        {(recording || transcribing) && (
          <div className="flex gap-2 p-2 items-center">
            <Disc className="size-3 text-red-500" strokeWidth={3} />
            <span className="text-sm text-custom-text-300 font-medium">Recording...</span>
          </div>
        )}
        <div
          className={cn(
            "bg-custom-background-100 rounded-xl p-3 flex flex-col gap-1 shadow-sm border-[0.5px] border-custom-border-200 justify-between h-fit",
            {
              "min-h-[120px]": !recording && !transcribing,
            }
          )}
        >
          {/* Input Box */}
          <PiChatEditorWithRef
            setEditorCommand={(command) => {
              setEditorCommands({ ...command });
            }}
            handleSubmit={handleSubmit}
            mentionSuggestions={(query: string) => getMentionSuggestions(query)}
            className={cn("flex-1", {
              "absolute w-0": transcribing || recording,
            })}
            ref={editorRef}
          />
          <div className="flex w-full gap-3 justify-between">
            {/* Focus */}
            {!recording && !transcribing && (
              <FocusFilter focus={focus} setFocus={updateFocus} isLoading={isChatLoading && !!activeChatId} />
            )}
            {/* Submit button */}
            <div className="flex items-center w-full justify-end">
              <WithFeatureFlagHOC
                workspaceSlug={workspaceSlug?.toString() || ""}
                flag={E_FEATURE_FLAGS.PI_CONVERSE}
                fallback={<></>}
              >
                <AudioRecorder
                  recording={recording}
                  workspaceId={workspaceId || ""}
                  chatId={activeChatIdRef.current || ""}
                  setChatId={setChatId}
                  editorRef={editorRef}
                  setRecording={setRecording}
                  setTranscribing={setTranscribing}
                  createNewChat={createNewChat}
                  focusRef={focusRef}
                  isProjectLevel={isProjectLevel}
                  transcribing={transcribing}
                  isFullScreen={isFullScreen}
                />
              </WithFeatureFlagHOC>
              {!recording && !transcribing && (
                <button
                  className={cn(
                    "rounded-full bg-pi-700 text-white size-8 flex items-center justify-center flex-shrink-0 disabled:bg-pi-700/10"
                  )}
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isPiTyping || isInitializing || transcribing}
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-custom-text-350 pt-2 text-center">
        Pi can make mistakes, please double-check responses.
      </div>
    </form>
  );
});
