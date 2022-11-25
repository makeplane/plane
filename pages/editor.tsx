import React, { useEffect, useRef } from "react";
// next
import type { NextPage } from "next";
// prose mirror
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";

const Editor: NextPage = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current || !contentRef.current) return;

    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

    const myEditorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema)?.parse(contentRef.current),
        plugins: exampleSetup({ schema: mySchema }),
      }),
    });

    return () => myEditorView.destroy();
  }, []);

  return (
    <div id="editor" ref={editorRef}>
      <div id="content" ref={contentRef} />
    </div>
  );
};

export default Editor;
