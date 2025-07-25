import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorRefApi, LiteTextEditorWithRef, RichTextEditorWithRef, TExtensions } from "@plane/editor";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { TrailingNode } from "@/extensions/trailing-node";
import { callNative } from "@/helpers";
import { getEditorFileHandlers } from "@/helpers/editor-file-asset.helper";
import { useDisableZoom, useToolbar, useMentions, useMobileEditor } from "@/hooks";
import { TEditorParams, TEditorVariant } from "@/types/editor";

export const EditorWrapper = ({ variant }: { variant: TEditorVariant }) => {
  const editorRef = useRef<EditorRefApi>(null);
  const [initialParams, setInitialParams] = useState<TEditorParams | undefined>();
  // It is a custom hook that disables zooming in the editor.
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
    [initialParams?.workspaceSlug, initialParams?.workspaceId, initialParams?.projectId, initialParams?.baseApi]
  );

  // This is called by the native code to reset the initial params of the editor.
  const resetInitialParams = useCallback((params: TEditorParams) => {
    setInitialParams(params);
  }, []);

  // This is called when the editor is ready to get the initial params from the native code.
  useEffect(() => {
    callNative(CallbackHandlerStrings.getInitialEditorParams).then((params: TEditorParams) => setInitialParams(params));
  }, []);

  // Disabled extensions for the editor.
  const disabledExtensions: TExtensions[] = useMemo(() => ["enter-key", "slash-commands"], []);

  // Additional extensions for the editor.
  const externalExtensions = useMemo(() => [TrailingNode], []);

  const mentionHandler = useMemo(
    () => ({
      suggestions: () => Promise.resolve(mentionSuggestionsRef.current),
      highlights: () => Promise.resolve(mentionHighlightsRef.current),
    }),
    [mentionSuggestionsRef.current, mentionHighlightsRef.current]
  );

  window.resetInitialParams = resetInitialParams;

  if (!initialParams) return null;

  return (
    <div className="scrollbar-hidden h-screen" onClick={onEditorFocus}>
      {variant === TEditorVariant.lite && (
        <LiteTextEditorWithRef
          ref={editorRef}
          autofocus
          disabledExtensions={disabledExtensions}
          extensions={externalExtensions}
          placeholder={initialParams?.placeholder}
          onTransaction={updateActiveStates}
          handleEditorReady={handleEditorReady}
          editorClassName="min-h-screen pb-32"
          containerClassName="p-0 border-none"
          mentionHandler={mentionHandler as any}
          fileHandler={fileHandler}
          initialValue={initialParams?.content ?? "<p></p>"}
          id="lite-editor"
        />
      )}
      {variant === TEditorVariant.rich && (
        <RichTextEditorWithRef
          ref={editorRef}
          extensions={externalExtensions}
          placeholder={initialParams?.placeholder}
          editorClassName="min-h-screen pb-32"
          containerClassName="p-0 border-none"
          bubbleMenuEnabled={false}
          disabledExtensions={disabledExtensions}
          mentionHandler={mentionHandler as any}
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
