import { CheckIcon, CopyIcon, GlobeIcon, LinkBreak1Icon } from "@radix-ui/react-icons";
import { Editor } from "@tiptap/react";
import { useState } from "react";

interface LinkPreviewProps {
  editor: Editor;
  from: number;
  to: number;
  url: string;
}

export const LinkPreview = ({ url, editor, from, to }: LinkPreviewProps) => {
  const [showIcon, setShowIcon] = useState(false);

  const handleClick = () => {
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 2000);
  };

  const removeLink = () => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    handleClick();
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(url);
    handleClick();
  };

  return (
    <div className="font-bold text-white shadow-md underline rounded p-2 flex gap-3 bg-custom-primary-300 text-xs">
      <GlobeIcon className="inline-block" />
      <p>{url.length > 40 ? url.slice(0, 40) + "..." : url}</p>
      <div className="flex gap-2">
        <button onClick={removeLink} className="bg-custom-primary-300 hover:bg-custom-primary-600 rounded">
          <LinkBreak1Icon className="inline-block" />
        </button>
        <button onClick={copyLinkToClipboard} className="bg-custom-primary-300 hover:bg-custom-primary-600 rounded">
          <CopyIcon className="inline-block" />
        </button>
        {showIcon && <CheckIcon className="inline-block" />}
      </div>
    </div>
  );
};
