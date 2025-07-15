import { Editor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import { TAIHandler, TDisplayConfig } from "@/types";

type Props = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  editor: Editor;
  editorContainerClassName: string;
  id: string;
  isLoading?: boolean;
  isMobile: boolean;
  tabIndex?: number;
};

export const PageRenderer = (props: Props) => {
  const {
    aiHandler,
    bubbleMenuEnabled,
    displayConfig,
    editor,
    editorContainerClassName,
    id,
    isLoading,
    isMobile,
    tabIndex,
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
        <EditorContainer
          displayConfig={displayConfig}
          editor={editor}
          editorContainerClassName={editorContainerClassName}
          id={id}
          isMobile={isMobile}
        >
          <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
          {editor.isEditable && !isMobile && (
            <div>
              {bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
              <BlockMenu editor={editor} />
              <AIFeaturesMenu menu={aiHandler?.menu} />
            </div>
          )}
        </EditorContainer>
      )}
    </div>
  );
};
