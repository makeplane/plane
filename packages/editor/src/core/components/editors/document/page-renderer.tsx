import { Editor } from "@tiptap/react";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import { TAIHandler, TDisplayConfig } from "@/types";

type IPageRenderer = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  editor: Editor;
  editorContainerClassName: string;
  id: string;
  isMobile: boolean;
  onEditorClick?: () => void;
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
    isMobile,
    onEditorClick,
    tabIndex,
  } = props;

  return (
    <div className="frame-renderer flex-grow w-full">
      <EditorContainer
        displayConfig={displayConfig}
        editor={editor}
        editorContainerClassName={editorContainerClassName}
        id={id}
        isMobile={isMobile}
      >
        <EditorContentWrapper editor={editor} id={id} onClick={onEditorClick} tabIndex={tabIndex} />
        {editor.isEditable && !isMobile && (
          <div>
            {bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
            <BlockMenu editor={editor} />
            <AIFeaturesMenu menu={aiHandler?.menu} />
          </div>
        )}
      </EditorContainer>
    </div>
  );
};
