import { Node } from "@tiptap/pm/model";
import { Link2Off } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// components
import { LinkViewProps } from "@/components/links";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { preventDefault } from "jsx-dom-cjs";

const InputView = ({
  label,
  defaultValue,
  placeholder,
  onChange,
  autoFocus,
}: {
  label: string;
  defaultValue: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="inline-block font-semibold text-xs text-custom-text-400">{label}</label>
    <input
      placeholder={placeholder}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="w-[280px] outline-none bg-custom-background-90 text-custom-text-900 text-sm"
      defaultValue={defaultValue}
      onChange={onChange}
      autoFocus={autoFocus}
    />
  </div>
);

export const LinkEditView = ({
  viewProps,
}: {
  viewProps: LinkViewProps;
  switchView: (view: "LinkPreview" | "LinkEditView" | "LinkInputView") => void;
}) => {
  const { editor, from, to } = viewProps;

  const getText = (from: number, to: number) => {
    if (to >= editor.state.doc.content.size) return "";
    const text = editor.state.doc.textBetween(from, to, "\n");
    return text;
  };

  const [positionRef] = useState({ from, to });
  const [localUrl, setLocalUrl] = useState(viewProps.url);
  const [localText, setLocalText] = useState(getText(from, to));
  const [linkRemoved, setLinkRemoved] = useState(false);
  const hasSubmitted = useRef(false);

  useEffect(
    () => () => {
      if (!hasSubmitted.current && !linkRemoved && viewProps.url === "") {
        removeLink();
      }
    },
    [linkRemoved, viewProps.url]
  );

  const handleUpdateLink = (url: string) => {
    setLocalUrl(url);
  };

  const handleUpdateText = (text: string) => {
    if (text === "") return;
    setLocalText(text);
  };

  const applyChanges = () => {
    if (linkRemoved) return;
    hasSubmitted.current = true;

    const { url, isValid } = isValidHttpUrl(localUrl);
    if (to >= editor.state.doc.content.size || !isValid) return;

    // Apply URL change
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    editor.view.dispatch(editor.state.tr.addMark(from, to, editor.schema.marks.link.create({ href: url })));

    // Apply text change if different
    if (localText !== getText(from, to)) {
      const node = editor.view.state.doc.nodeAt(from) as Node;
      if (!node) return;
      const marks = node.marks;
      if (!marks) return;

      editor
        .chain()
        .setTextSelection(from)
        .deleteRange({ from: positionRef.from, to: positionRef.to })
        .insertContent(localText)
        .setTextSelection({ from, to: from + localText.length })
        .run();

      marks.forEach((mark) => {
        editor.chain().setMark(mark.type.name, mark.attrs).run();
      });
    }
  };

  const removeLink = () => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    setLinkRemoved(true);
    viewProps.closeLinkView();
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          applyChanges();
          viewProps.closeLinkView();
          e.stopPropagation();
          setLocalUrl("");
          setLocalText("");
        }
      }}
      className="shadow-md rounded p-2 flex flex-col gap-3 bg-custom-background-90 border-custom-border-100 border-2"
      tabIndex={0}
    >
      <InputView
        label={"URL"}
        placeholder={"Enter or paste URL"}
        defaultValue={localUrl}
        onChange={(e) => handleUpdateLink(e.target.value)}
        autoFocus
      />
      <InputView
        label={"Text"}
        placeholder={"Enter Text to display"}
        defaultValue={localText}
        onChange={(e) => handleUpdateText(e.target.value)}
      />
      <div className="mb-1 bg-custom-border-300 h-[1px] w-full gap-2" />
      {/* {viewProps.url !== "" && ( */}
      <div className="flex text-sm text-custom-text-800 gap-2 items-center">
        <Link2Off size={14} className="inline-block" />
        <button onClick={() => removeLink()} className="cursor-pointer">
          Remove Link
        </button>
      </div>
      {/* )} */}
    </div>
  );
};
