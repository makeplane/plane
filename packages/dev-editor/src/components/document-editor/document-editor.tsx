import {
  CollaborativeDocumentEditorWithRef,
  EditorRefApi,
  TDisplayConfig,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateRandomColor } from "../../helpers/string.helper";
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "../../helpers/common.helper";
import { getEditorFileHandlers } from "../../helpers/editor-file.helper";
import { TDocumentEditorParams } from "@/types/editor";
import { useDisableZoom } from "@/hooks/use-disable-zoom";
import { useMentions, useMobileEditor, useToolbar } from "@/hooks";

export const MobileDocumentEditor = () => {
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  const [initialParams, setInitialParams] = useState<TDocumentEditorParams | undefined>({
    pageId: "6642257b-2835-40e3-b612-adeb28fdfd5c",
    documentType: "project_page",
    projectId: "0d71aeb8-795e-4793-b854-182d340edffd",
    userId: "fc2b4671-f8c3-4490-8357-cfb7fe8aa6b0",
    userDisplayName: "akash",
    workspaceSlug: "test",
    workspaceId: "17080dde-3d62-43fb-9cee-78fab34c1db3",
    baseApi: "http://localhost:8000",
    variant: "document",
  });

  const editorRef = useRef<EditorRefApi>(null);
  // It is a custom hook that disables zooming in the editor.
  useDisableZoom();
  // It is a custom hook that keeps the native toolbar in sync with the editor state.
  const { updateActiveStates } = useToolbar(editorRef);

  const { handleEditorReady, onEditorFocus } = useMobileEditor(editorRef);

  const { mentionSuggestionsRef, mentionHighlightsRef } = useMentions();

  const fileHandler = useMemo(
    () =>
      getEditorFileHandlers({
        workspaceSlug: initialParams?.workspaceSlug ?? "",
        workspaceId: initialParams?.workspaceId ?? "",
        projectId: initialParams?.projectId ?? "",
        baseApi: initialParams?.baseApi ?? "",
      }),
    [initialParams?.workspaceSlug, initialParams?.workspaceId, initialParams?.projectId, initialParams?.baseApi]
  );

  const displayConfig: TDisplayConfig = {
    fontSize: "large-font",
    fontStyle: "sans-serif",
  };

  const handleServerConnect = useCallback(() => setHasConnectionFailed(false), []);

  const handleServerError = useCallback(() => setHasConnectionFailed(true), []);

  const serverHandler: TServerHandler = useMemo(
    () => ({
      onConnect: handleServerConnect,
      onServerError: handleServerError,
    }),
    []
  );

  const realtimeConfig: TRealtimeConfig | undefined = useMemo(() => {
    if (!initialParams) return undefined;
    // Construct the WebSocket Collaboration URL
    try {
      const LIVE_SERVER_BASE_URL = LIVE_BASE_URL?.trim() || window.location.origin;
      const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
      const isSecureEnvironment = window.location.protocol === "https:";
      WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
      WS_LIVE_URL.pathname = `${LIVE_BASE_PATH}/collaboration`;
      // Construct realtime config
      return {
        url: WS_LIVE_URL.toString(),
        queryParams: {
          workspaceSlug: initialParams.workspaceSlug.toString(),
          documentType: initialParams.documentType.toString(),
          projectId: initialParams.projectId ?? "",
        },
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [initialParams]);

  // useEffect(() => {
  //   window.flutter_inappwebview
  //     ?.callHandler("getInitialDocumentEditorParams")
  //     .then((params: TDocumentEditorParams) => setInitialParams(params));
  // }, []);

  if (!realtimeConfig || !initialParams) return null;

  return (
    <div onClick={onEditorFocus}>
      <CollaborativeDocumentEditorWithRef
        // slashCommandEnabled={false}
        // onTransaction={updateActiveStates}
        id={initialParams?.pageId}
        fileHandler={fileHandler}
        handleEditorReady={handleEditorReady}
        ref={editorRef}
        containerClassName="h-full p-32 pb-64"
        displayConfig={displayConfig}
        editorClassName="pl-6"
        mentionHandler={{
          highlights: () => Promise.resolve(mentionHighlightsRef?.current),
          suggestions: () => Promise.resolve(mentionSuggestionsRef?.current),
        }}
        realtimeConfig={realtimeConfig}
        serverHandler={serverHandler}
        user={{
          id: initialParams?.userId ?? "",
          // cookie: initialParams?.cookie,
          name: initialParams?.userDisplayName ?? "",
          color: generateRandomColor(initialParams?.userId ?? ""),
        }}
        disabledExtensions={[]}
        embedHandler={{
          issue: undefined,
        }}
      />
    </div>
  );
};
