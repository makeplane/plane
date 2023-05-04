import { useState, useRef } from "react";

import dynamic from "next/dynamic";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
});

const initialValue = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

const Testing = () => {
  const editorRef = useRef<any>();

  const [value, setValue] = useState(initialValue);

  console.log("editor: ",editorRef)

  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <RemirrorRichTextEditor
        ref={editorRef}
        placeholder="Type something..."
        customClassName="w-96 h-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={value}
        onJSONChange={(json) => {
          setValue(json);
        }}
      />

      <button type="button" onClick={() => {}}>
        Clear
      </button>
    </div>
  );
};

export default Testing;
