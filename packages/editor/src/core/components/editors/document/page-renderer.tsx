import { Editor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import type { IEditorProps, IEditorPropsExtended, TAIHandler, TDisplayConfig } from "@/types";

type Props = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  documentLoaderClassName?: string;
  editor: Editor;
  titleEditor?: Editor;
  editorContainerClassName: string;
  id: string;
  isLoading?: boolean;
  isTouchDevice: boolean;
  tabIndex?: number;
  extendedEditorProps?: IEditorPropsExtended;
  flaggedExtensions: IEditorProps["flaggedExtensions"];
  disabledExtensions: IEditorProps["disabledExtensions"];
};

export const PageRenderer = (props: Props) => {
  const {
    aiHandler,
    bubbleMenuEnabled,
    displayConfig,
    documentLoaderClassName,
    editor,
    editorContainerClassName,
    id,
    isLoading,
    isTouchDevice,
    tabIndex,
    titleEditor,
    extendedEditorProps,
    flaggedExtensions,
    disabledExtensions,
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
        <>
          {titleEditor && (
            <div className="relative w-full py-3">
              <EditorContainer
                editor={titleEditor}
                id={id + "-title"}
                isTouchDevice={isTouchDevice}
                editorContainerClassName="page-title-editor bg-transparent py-3 border-none"
                displayConfig={displayConfig}
              >
                <EditorContentWrapper
                  editor={titleEditor}
                  id={id + "-title"}
                  tabIndex={tabIndex}
                  className="no-scrollbar placeholder-custom-text-400 bg-transparent tracking-[-2%] font-bold text-[2rem] leading-[2.375rem] w-full outline-none p-0 border-none resize-none rounded-none"
                />
              </EditorContainer>
            </div>
          )}
          <EditorContainer
            displayConfig={displayConfig}
            editor={editor}
            editorContainerClassName={editorContainerClassName}
            id={id}
            isTouchDevice={isTouchDevice}
          >
            <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
            {editor.isEditable && !isTouchDevice && (
              <div>
                {bubbleMenuEnabled && (
                  <EditorBubbleMenu
                    flaggedExtensions={flaggedExtensions}
                    editor={editor}
                    extendedEditorProps={extendedEditorProps}
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
        </>
      )}
    </div>
  );
};
