import type { Node } from "@tiptap/pm/model";
import { Link2Off } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// components
import type { LinkViewProps, LinkViews } from "@/components/links";
// helpers
import { isValidHttpUrl } from "@/helpers/common";

type InputViewProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

function InputView({ label, value, placeholder, onChange, autoFocus }: InputViewProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="inline-block font-semibold text-11 text-placeholder">{label}</label>
      <input
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
        className="w-[280px] outline-none bg-layer-1 text-primary text-13 border border-strong rounded-md p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  );
}

type LinkEditViewProps = {
  viewProps: LinkViewProps;
  switchView: (view: LinkViews) => void;
};

export function LinkEditView({ viewProps }: LinkEditViewProps) {
  const { editor, from, to, url: initialUrl, text: initialText, closeLinkView } = viewProps;

  // State
  const [positionRef] = useState({ from, to });
  const [localUrl, setLocalUrl] = useState(initialUrl);
  const [localText, setLocalText] = useState(initialText ?? "");
  const [linkRemoved, setLinkRemoved] = useState(false);
  const hasSubmitted = useRef(false);

  const removeLink = useCallback(() => {
    editor.view.dispatch(editor.state.tr.removeMark(from, to, editor.schema.marks.link));
    setLinkRemoved(true);
    closeLinkView();
  }, [editor, from, to, closeLinkView]);

  // Effects
  useEffect(
    () =>
      // Cleanup effect: Remove link if not submitted and url is empty
      () => {
        if (!hasSubmitted.current && !linkRemoved && initialUrl === "") {
          try {
            removeLink();
          } catch (e) {
            console.error("Error removing link", e);
          }
        }
      },
    [removeLink, linkRemoved, initialUrl]
  );

  // Sync state with props
  useEffect(() => {
    setLocalUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (initialText) setLocalText(initialText);
  }, [initialText]);

  // Handlers
  const handleTextChange = useCallback((value: string) => {
    if (value.trim() !== "") setLocalText(value);
  }, []);

  const applyChanges = useCallback((): boolean => {
    if (linkRemoved) return false;
    hasSubmitted.current = true;

    const { url, isValid } = isValidHttpUrl(localUrl);
    if (to >= editor.state.doc.content.size || !isValid) return false;

    // Apply URL change
    const tr = editor.state.tr;
    tr.removeMark(from, to, editor.schema.marks.link).addMark(from, to, editor.schema.marks.link.create({ href: url }));
    editor.view.dispatch(tr);

    // Apply text change if different
    if (localText !== initialText) {
      const node = editor.view.state.doc.nodeAt(from) as Node;
      if (!node || !node.marks) return false;

      editor
        .chain()
        .setTextSelection(from)
        .deleteRange({ from: positionRef.from, to: positionRef.to })
        .insertContent(localText)
        .setTextSelection({ from, to: from + localText.length })
        .run();
      //
      // Restore marks
      node.marks.forEach((mark) => {
        editor.chain().setMark(mark.type.name, mark.attrs).run();
      });
    }

    return true;
  }, [linkRemoved, positionRef, editor, from, to, initialText, localText, localUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        if (applyChanges()) {
          closeLinkView();
          setLocalUrl("");
          setLocalText("");
        }
      }
    },
    [applyChanges, closeLinkView]
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      className="shadow-md rounded-sm p-2 flex flex-col gap-3 bg-layer-1 border-subtle border-2 animate-in fade-in translate-y-1"
      style={{
        transition: "all 0.1s cubic-bezier(.55, .085, .68, .53)",
      }}
      tabIndex={0}
    >
      <InputView label="URL" placeholder="Enter or paste URL" value={localUrl} onChange={setLocalUrl} autoFocus />
      <InputView label="Text" placeholder="Enter Text to display" value={localText} onChange={handleTextChange} />
      <div className="mb-1 bg-strong h-[1px] w-full gap-2" />
      <div className="flex text-13 text-secondary gap-2 items-center">
        <Link2Off size={14} className="inline-block" />
        <button onClick={removeLink} className="cursor-pointer hover:text-placeholder transition-colors">
          Remove Link
        </button>
      </div>
    </div>
  );
}
