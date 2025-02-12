import { Editor, useEditorState } from "@tiptap/react";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
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

  const editorState = useEditorState({
    editor,
    selector: ({ editor }: { editor: Editor }) => ({
      linkExtensionStorage: getExtensionStorage(editor, "link"),
    }),
  });

  console.log("!editorState.linkExtensionStorage.isPreviewOpen", editorState.linkExtensionStorage);
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
          <div>
            {bubbleMenuEnabled && !editorState.linkExtensionStorage.isPreviewOpen && (
              <EditorBubbleMenu editor={editor} />
            )}
            <BlockMenu editor={editor} />
            <AIFeaturesMenu menu={aiHandler?.menu} />
          </div>
        )}
      </EditorContainer>
    </div>
  );
};
