import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorRefApi, LiteTextEditorWithRef, RichTextEditorWithRef } from "@plane/editor";
import { useDisableZoom, useToolbar, useMentions, useMobileEditor } from "@/hooks";
import { getEditorFileHandlers } from "@/helpers/editor-file.helper";
import { TEditorParams, TEditorVariant } from "@/types/editor";

declare global {
  interface Window {
    flutter_inappwebview: any;
    resetInitialParams: (params: TEditorParams) => void;
  }
}

export const EditorWrapper = ({ variant }: { variant: TEditorVariant }) => {
  const editorRef = useRef<EditorRefApi>(null);
  const [initialParams, setInitialParams] = useState<TEditorParams | undefined>();
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

  // This is called by the native code to reset the initial params of the editor.
  const resetInitialParams = useCallback((params: TEditorParams) => {
    setInitialParams(params);
  }, []);
  window.resetInitialParams = resetInitialParams;

  useEffect(() => {
    window.flutter_inappwebview
      ?.callHandler("getInitialEditorParams")
      .then((params: TEditorParams) => setInitialParams(params));
  }, []);

  if (!initialParams) return null;

  return (
    <div className="scrollbar-hidden h-screen" onClick={onEditorFocus}>
      {variant === TEditorVariant.lite && (
        <LiteTextEditorWithRef
          isEnterExtensionEnabled={false}
          ref={editorRef}
          autofocus
          placeholder={initialParams?.placeholder}
          onTransaction={updateActiveStates}
          handleEditorReady={handleEditorReady}
          editorClassName="min-h-screen pb-32"
          containerClassName="p-0 border-none"
          mentionHandler={{
            suggestions: () => Promise.resolve(mentionSuggestionsRef.current),
            highlights: () => Promise.resolve(mentionHighlightsRef.current),
          }}
          fileHandler={fileHandler}
          initialValue={initialParams?.content ?? "<p></p>"}
          id="lite-editor"
        />
      )}
      {variant === TEditorVariant.rich && (
        <RichTextEditorWithRef
          ref={editorRef}
          placeholder={initialParams?.placeholder}
          editorClassName="min-h-screen p-32 pb-32"
          containerClassName="p-0 border-none"
          bubbleMenuEnabled={false}
          slashCommandEnabled={false}
          mentionHandler={{
            suggestions: () => Promise.resolve(mentionSuggestionsRef.current),
            highlights: () => Promise.resolve(mentionHighlightsRef.current),
          }}
          onTransaction={updateActiveStates}
          handleEditorReady={handleEditorReady}
          fileHandler={fileHandler}
          initialValue={initialParams?.content ?? "<p></p>"}
          id="rich-editor"
        />
      )}
    </div>
  );
};
