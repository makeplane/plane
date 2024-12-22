import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { Check, Link, Trash } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { setLinkEditor, unsetLinkEditor } from "@/helpers/editor-commands";

type Props = {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const BubbleMenuLinkSelector: FC<Props> = (props) => {
  const { editor, isOpen, setIsOpen } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const onLinkSubmit = useCallback(() => {
    const input = inputRef.current;
    const url = input?.value;
    if (url && isValidHttpUrl(url)) {
      setLinkEditor(editor, url);
      setIsOpen(false);
    }
  }, [editor, inputRef, setIsOpen]);

  useEffect(() => {
    inputRef.current && inputRef.current?.focus();
  });

  return (
    <div className="relative h-full">
      <button
        type="button"
        className={cn(
          "h-full flex items-center gap-1 px-3 text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 rounded transition-colors",
          {
            "bg-custom-background-80": isOpen,
            "text-custom-text-100": editor.isActive("link"),
          }
        )}
        onClick={(e) => {
          setIsOpen(!isOpen);
          e.stopPropagation();
        }}
      >
        <span>Link</span>
        <Link className="flex-shrink-0 size-3" />
      </button>
      {isOpen && (
        <div
          className="dow-xl fixed top-full z-[99999] mt-1 flex w-60 overflow-hidden rounded border border-custom-border-300 bg-custom-background-100 animate-in fade-in slide-in-from-top-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onLinkSubmit();
            }
          }}
        >
          <input
            ref={inputRef}
            type="url"
            placeholder="Paste a link"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 border-r border-custom-border-300 bg-custom-background-100 p-1 text-sm outline-none placeholder:text-custom-text-400"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <button
              type="button"
              className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
              onClick={(e) => {
                unsetLinkEditor(editor);
                setIsOpen(false);
                e.stopPropagation();
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="flex items-center rounded-sm p-1 text-custom-text-300 transition-all hover:bg-custom-background-90"
              type="button"
              onClick={(e) => {
                onLinkSubmit();
                e.stopPropagation();
              }}
            >
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
