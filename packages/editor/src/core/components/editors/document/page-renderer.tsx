import { Editor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import { TAIHandler, TDisplayConfig } from "@/types";

type IPageRenderer = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  editor: Editor;
  titleEditor?: Editor;
  editorContainerClassName: string;
  id: string;
  isLoading?: boolean;
  tabIndex?: number;
};

export const PageRenderer = (props: IPageRenderer) => {
  const {
    aiHandler,
    bubbleMenuEnabled,
    displayConfig,
    editor,
    editorContainerClassName,
    id,
    tabIndex,
    titleEditor,
    isLoading = false,
  } = props;

  return (
    <div
      className={cn("frame-renderer flex-grow w-full", {
        "wide-layout": displayConfig.wideLayout,
      })}
    >
      {isLoading ? (
        <DocumentContentLoader />
      ) : (
        <>
          {titleEditor && (
            <div className="relative w-full py-3">
              <EditorContainer
                editor={titleEditor}
                id={id + "-title"}
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
          >
            <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
            {editor.isEditable && (
              <div>
                {bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
                <BlockMenu editor={editor} />
                <AIFeaturesMenu menu={aiHandler?.menu} />
              </div>
            )}
          </EditorContainer>
        </>
      )}
    </div>
  );
};
