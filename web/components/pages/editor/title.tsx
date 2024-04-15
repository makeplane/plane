import { observer } from "mobx-react";
// editor
import { EditorRefApi } from "@plane/document-editor";
// ui
import { TextArea } from "@plane/ui";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnly: boolean;
  title: string;
  updateTitle: (title: string) => void;
};

export const PageEditorTitle: React.FC<Props> = observer((props) => {
  const { editorRef, readOnly, title, updateTitle } = props;

  return (
    <>
      {readOnly ? (
        <h6 className="-mt-2 break-words bg-transparent text-4xl font-bold">{title}</h6>
      ) : (
        <TextArea
          onChange={(e) => updateTitle(e.target.value)}
          className="-mt-2 w-full bg-custom-background text-4xl font-bold outline-none p-0 border-none resize-none rounded-none"
          style={{
            lineHeight: "1.2",
          }}
          placeholder="Untitled Page"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editorRef.current?.setFocusAtPosition(0);
            }
          }}
          value={title}
        />
      )}
    </>
  );
});
