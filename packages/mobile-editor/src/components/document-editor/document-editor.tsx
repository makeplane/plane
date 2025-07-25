import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CollaborativeDocumentEditorWithRef,
  EditorRefApi,
  TDisplayConfig,
  TExtensions,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
import type { TWebhookConnectionQueryParams } from "@plane/types";
import { IssueEmbedCard, IssueEmbedUpgradeCard, PageContentLoader } from "@/components";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative, generateRandomColor, getEditorFileHandlers } from "@/helpers";
import { useMentions, useMobileEditor, useToolbar, useEditorFlagging, useDisableZoom } from "@/hooks";
import type { TDocumentEditorParams } from "@/types/editor";

export const MobileDocumentEditor = () => {
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  const [initialParams, setInitialParams] = useState<TDocumentEditorParams | undefined>();

  // hooks
  const { disabledExtensions, isIssueEmbedEnabled } = useEditorFlagging();

  const editorRef = useRef<EditorRefApi>(null);
  // It disables zooming in the editor.
  useDisableZoom();
  // It keeps the native toolbar in sync with the editor state.
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
    [initialParams]
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
      const LIVE_SERVER_BASE_URL = initialParams?.liveServerUrl.trim();
      const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
      const isSecureEnvironment = initialParams?.liveServerUrl.startsWith("https");
      WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
      WS_LIVE_URL.pathname = `${initialParams?.liveServerBasePath}/collaboration`;

      // Construct realtime config
      return {
        url: WS_LIVE_URL.toString(),
        queryParams: {
          workspaceSlug: initialParams.workspaceSlug.toString(),
          documentType: initialParams.documentType.toString() as TWebhookConnectionQueryParams["documentType"],
          projectId: initialParams.projectId ?? "",
        },
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [initialParams]);

  // Disabled extensions for the editor.
  const resolvedDisabledExtensions: TExtensions[] = useMemo(
    () => [...(disabledExtensions ?? []), "slash-commands"],
    [disabledExtensions]
  );

  const mentionHandler = useMemo(
    () => ({
      suggestions: () => Promise.resolve(mentionSuggestionsRef.current),
      highlights: () => Promise.resolve(mentionHighlightsRef.current),
    }),
    [mentionSuggestionsRef.current, mentionHighlightsRef.current]
  );

  const userConfig = useMemo(
    () => ({
      id: initialParams?.userId ?? "",
      cookie: initialParams?.cookie,
      name: initialParams?.userDisplayName ?? "",
      color: generateRandomColor(initialParams?.userId ?? ""),
    }),
    [initialParams]
  );

  useEffect(() => {
    callNative(CallbackHandlerStrings.getInitialDocumentEditorParams).then((params: TDocumentEditorParams) =>
      setInitialParams(params)
    );
  }, []);

  if (hasConnectionFailed) return null;

  if (!realtimeConfig || !initialParams || !disabledExtensions) return <PageContentLoader />;

  return (
    <div onClick={onEditorFocus} className="min-h-screen">
      <CollaborativeDocumentEditorWithRef
        editable
        placeholder={"Write something..."}
        onTransaction={updateActiveStates}
        id={initialParams?.pageId}
        fileHandler={fileHandler}
        handleEditorReady={handleEditorReady}
        ref={editorRef}
        containerClassName="min-h-screen p-0"
        displayConfig={displayConfig}
        editorClassName="pl-6 min-h-screen pb-32 pt-6"
        mentionHandler={mentionHandler as any}
        realtimeConfig={realtimeConfig}
        serverHandler={serverHandler}
        user={userConfig}
        disabledExtensions={resolvedDisabledExtensions}
        embedHandler={{
          issue: {
            widgetCallback: ({ issueId, projectId, workspaceSlug }) => {
              if (!isIssueEmbedEnabled) return <IssueEmbedUpgradeCard />;
              return <IssueEmbedCard issueId={issueId} projectId={projectId} workspaceSlug={workspaceSlug} />;
            },
          },
        }}
      />
    </div>
  );
};
