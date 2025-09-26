import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { ArrowUp, Disc } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EditorRefApi, PiChatEditorWithRef } from "@plane/editor";
import { cn, isCommentEmpty, joinUrlPath } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import useEvent from "@/plane-web/hooks/use-event";
import { TFocus, TPiLoaders } from "@/plane-web/types";
// local imports
import { WithFeatureFlagHOC } from "../../feature-flags";
import AudioRecorder, { SPEECH_LOADERS } from "../converse/voice-input";
import { formatSearchQuery } from "../helper";
import { FocusFilter } from "./focus-filter";

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
    isPiTyping,
    isLoading: isChatLoading,
    getAnswer,
    searchCallback,
    createNewChat,
    getChatFocus,
    fetchModels,
  } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  // router
  const { workspaceSlug, projectId, chatId: routeChatId } = useParams();
  const router = useRouter();
  const routerWithProgress = useAppRouter();
  const pathname = usePathname();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id;
  const chatFocus = getChatFocus(activeChatId, projectId?.toString(), workspaceId?.toString());
  // state
  const [focus, setFocus] = useState<TFocus>(chatFocus);
  const [loader, setLoader] = useState<TPiLoaders>("");
  //ref
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

  const handleSubmit = useEvent(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = editorCommands.current?.getHTML();
    if (isPiTyping || loader === "submitting" || !query || isCommentEmpty(query) || !workspaceId) return;
    let chatIdToUse = activeChatId;
    setLoader("submitting");
    if (!chatIdToUse) {
      chatIdToUse = await createNewChat(focus, isProjectLevel, workspaceId);
    }
    // Don't redirect if we are in the floating chat window
    if (shouldRedirect && !routeChatId)
      (showProgress ? routerWithProgress : router).push(
        joinUrlPath(workspaceSlug?.toString(), isProjectLevel ? "projects" : "", "pi-chat", chatIdToUse)
      );
    await getAnswer(chatIdToUse || "", query, focus, isProjectLevel, workspaceSlug?.toString(), workspaceId, pathname);
    editorCommands.current?.clear();
    setLoader("");
  });

  const getMentionSuggestions = async (query: string) => {
    const response = await searchCallback(workspaceSlug.toString(), query, focus);
    return formatSearchQuery(response);
  };

  useEffect(() => {
    if (chatFocus) {
      const presentFocus = {
        isInWorkspaceContext: chatFocus.isInWorkspaceContext,
        entityType: chatFocus.entityType,
        entityIdentifier: chatFocus.entityIdentifier,
      };
      setFocus(presentFocus);
    }
  }, [isChatLoading]);

  return (
    <form
      className={cn(
        "bg-custom-background-100 flex flex-col absolute bottom-0 left-0 px-2 pb-3 md:px-0 rounded-lg w-full",
        className
      )}
    >
      <div className={cn("bg-custom-background-90 rounded-xl transition-[max-height] duration-100 max-h-[250px]")}>
        {/* Audio Recorder Loader */}
        {SPEECH_LOADERS.includes(loader) && (
          <div className="flex gap-2 p-2 items-center">
            <Disc className="size-3 text-red-500" strokeWidth={3} />
            <span className="text-sm text-custom-text-300 font-medium">Recording...</span>
          </div>
        )}
        <div
          className={cn(
            "bg-custom-background-100 rounded-xl p-3 flex flex-col gap-1 shadow-sm border-[0.5px] border-custom-border-200 justify-between h-fit",
            {
              "min-h-[120px]": !SPEECH_LOADERS.includes(loader),
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
              "absolute w-0": SPEECH_LOADERS.includes(loader),
            })}
            ref={editorRef}
          />
          <div className="flex w-full gap-3 justify-between">
            {/* Focus */}
            {!SPEECH_LOADERS.includes(loader) && (
              <FocusFilter focus={focus} setFocus={setFocus} isLoading={isChatLoading && !!activeChatId} />
            )}
            <div className="flex items-center w-full justify-end">
              {/* Audio Recorder */}
              <WithFeatureFlagHOC
                workspaceSlug={workspaceSlug?.toString() || ""}
                flag={E_FEATURE_FLAGS.PI_CONVERSE}
                fallback={<></>}
              >
                <AudioRecorder
                  workspaceId={workspaceId || ""}
                  chatId={activeChatId || ""}
                  editorRef={editorRef}
                  createNewChat={createNewChat}
                  isProjectLevel={isProjectLevel}
                  loader={loader}
                  setLoader={setLoader}
                  isFullScreen={isFullScreen}
                  focus={focus}
                />
              </WithFeatureFlagHOC>
              {/* Submit button */}
              {!SPEECH_LOADERS.includes(loader) && (
                <button
                  className="rounded-full bg-pi-700 text-white size-8 flex items-center justify-center flex-shrink-0 disabled:bg-pi-700/10"
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isPiTyping || loader === "submitting"}
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-custom-text-350 pt-2 text-center">
        Plane AI can make mistakes, please double-check responses.
      </div>
    </form>
  );
});
