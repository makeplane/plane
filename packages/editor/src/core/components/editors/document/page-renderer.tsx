import { Editor } from "@tiptap/react";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import { TAIHandler, TDisplayConfig, TExtensions } from "@/types";

type Props = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  editor: Editor;
  editorContainerClassName: string;
  id: string;
  tabIndex?: number;
  disabledExtensions: TExtensions[];
};

export const PageRenderer = (props: Props) => {
  const {
    aiHandler,
    bubbleMenuEnabled,
    displayConfig,
    editor,
    editorContainerClassName,
    id,
    tabIndex,
    disabledExtensions,
  } = props;

  return (
    <div className="frame-renderer flex-grow w-full">
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
            <BlockMenu editor={editor} disabledExtensions={disabledExtensions} />
            <AIFeaturesMenu menu={aiHandler?.menu} />
          </div>
        )}
      </EditorContainer>
    </div>
  );
};
