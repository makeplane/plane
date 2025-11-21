import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import type { TCollabValue } from "@/contexts/collaboration-context";
import type { ICollaborativeDocumentEditorPropsExtended, IEditorProps, TAIHandler, TDisplayConfig } from "@/types";

type Props = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  disabledExtensions: IEditorProps["disabledExtensions"];
  displayConfig: TDisplayConfig;
  documentLoaderClassName?: string;
  editor: Editor;
  editorContainerClassName: string;
  extendedDocumentEditorProps?: ICollaborativeDocumentEditorPropsExtended;
  extendedEditorProps: IEditorPropsExtended;
  flaggedExtensions: IEditorProps["flaggedExtensions"];
  id: string;
  isLoading?: boolean;
  isTouchDevice: boolean;
  tabIndex?: number;
  flaggedExtensions: IEditorProps["flaggedExtensions"];
  disabledExtensions: IEditorProps["disabledExtensions"];
  provider?: HocuspocusProvider;
  state?: TCollabValue["state"];
};

export function PageRenderer(props: Props) {
  const {
    aiHandler,
    bubbleMenuEnabled,
    disabledExtensions,
    displayConfig,
    documentLoaderClassName,
    editor,
    editorContainerClassName,
    extendedEditorProps,
    flaggedExtensions,
    id,
    isLoading,
    isTouchDevice,
    tabIndex,
    flaggedExtensions,
    disabledExtensions,
    provider,
    state,
  } = props;

  return (
    <div
      className={cn("frame-renderer flex-grow w-full", {
        "wide-layout": displayConfig.wideLayout,
      })}
    >
      {isLoading ? (
        <DocumentContentLoader className={documentLoaderClassName} />
      ) : (
        <EditorContainer
          displayConfig={displayConfig}
          editor={editor}
          editorContainerClassName={editorContainerClassName}
          id={id}
          isTouchDevice={isTouchDevice}
          provider={provider}
          state={state}
        >
          <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
          {editor.isEditable && !isTouchDevice && (
            <div>
              {bubbleMenuEnabled && (
                <EditorBubbleMenu
                  disabledExtensions={disabledExtensions}
                  editor={editor}
                  extendedEditorProps={extendedEditorProps}
                  flaggedExtensions={flaggedExtensions}
                />
              )}
              <BlockMenu
                editor={editor}
                flaggedExtensions={flaggedExtensions}
                disabledExtensions={disabledExtensions}
              />
              <AIFeaturesMenu menu={aiHandler?.menu} />
            </div>
          )}
        </EditorContainer>
      )}
    </div>
  );
}
