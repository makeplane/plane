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
  tabIndex?: number;
};

export const PageRenderer = (props: IPageRenderer) => {
  const { aiHandler, bubbleMenuEnabled, displayConfig, editor, editorContainerClassName, id, tabIndex } = props;

  return (
    <div className="frame-renderer flex-grow w-full -mx-5">
      <EditorContainer
        displayConfig={displayConfig}
        editor={editor}
        editorContainerClassName={editorContainerClassName}
        id={id}
      >
        <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
        {editor.isEditable && (
          <>
            {bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
            <BlockMenu editor={editor} />
            <AIFeaturesMenu menu={aiHandler?.menu} />
          </>
        )}
      </EditorContainer>
    </div>
  );
};
