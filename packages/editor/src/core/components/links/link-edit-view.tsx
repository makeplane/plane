import { useEffect, useRef, useState } from "react";
import { Node } from "@tiptap/pm/model";
import { Link2Off } from "lucide-react";
// components
import { LinkViewProps } from "@/components/links";
// helpers
import { isValidHttpUrl } from "@/helpers/common";

const InputView = ({
  label,
  defaultValue,
  placeholder,
  onChange,
}: {
  label: string;
  defaultValue: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

  const [positionRef, setPositionRef] = useState({ from: from, to: to });
  const [localUrl, setLocalUrl] = useState(viewProps.url);

  const linkRemoved = useRef<boolean>();

  const getText = (from: number, to: number) => {
    if (to >= editor.state.doc.content.size) return "";

    const text = editor.state.doc.textBetween(from, to, "\n");
    return text;
  };

  const handleUpdateLink = (url: string) => {
    setLocalUrl(url);
  };

  useEffect(
    () => () => {
      if (linkRemoved.current) return;

      const url = isValidHttpUrl(localUrl) ? localUrl : viewProps.url;

      if (to >= editor.state.doc.content.size) return;

      editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
      editor.view.dispatch(editor.state.tr.addMark(from, to, editor.schema.marks.link.create({ href: url })));
    },
    [localUrl, editor, from, to, viewProps.url]
  );

  const handleUpdateText = (text: string) => {
    if (text === "") {
      return;
    }

    const node = editor.view.state.doc.nodeAt(from) as Node;
    if (!node) return;
    const marks = node.marks;
    if (!marks) return;

    editor.chain().setTextSelection(from).run();

    editor.chain().deleteRange({ from: positionRef.from, to: positionRef.to }).run();
    editor.chain().insertContent(text).run();

    editor
      .chain()
      .setTextSelection({
        from: from,
        to: from + text.length,
      })
      .run();

    setPositionRef({ from: from, to: from + text.length });

    marks.forEach((mark) => {
      editor.chain().setMark(mark.type.name, mark.attrs).run();
    });
  };

  const removeLink = () => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    linkRemoved.current = true;
    viewProps.closeLinkView();
  };

  return (
    <div
      onKeyDown={(e) => e.key === "Enter" && viewProps.closeLinkView()}
      className="shadow-md rounded p-2 flex flex-col gap-3 bg-custom-background-90 border-custom-border-100 border-2"
    >
      <InputView
        label={"URL"}
        placeholder={"Enter or paste URL"}
        defaultValue={localUrl}
        onChange={(e) => handleUpdateLink(e.target.value)}
      />
      <InputView
        label={"Text"}
        placeholder={"Enter Text to display"}
        defaultValue={getText(from, to)}
        onChange={(e) => handleUpdateText(e.target.value)}
      />
      <div className="mb-1 bg-custom-border-300 h-[1px] w-full gap-2" />
      <div className="flex text-sm text-custom-text-800 gap-2 items-center">
        <Link2Off size={14} className="inline-block" />
        <button onClick={() => removeLink()} className="cursor-pointer">
          Remove Link
        </button>
      </div>
    </div>
  );
};
