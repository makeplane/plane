import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { getValidatedValue } from "../helpers/editor";

const ReadOnlyPlugin = ({ value }: { value: string }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (editor && value) {
      const initialEditorState = editor?.parseEditorState(
        getValidatedValue(value) || ""
      );
      editor.setEditorState(initialEditorState);
    }
  }, [editor, value]);

  return <></>;
};

export default ReadOnlyPlugin;
