import { Editor } from "@tiptap/core";
import { Check, Link, Trash2 } from "lucide-react";
import { Dispatch, FC, SetStateAction, useCallback, useRef, useState } from "react";
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
  // states
  const [error, setError] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLinkSubmit = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    let url = input.value;
    if (!url) return;
    if (!url.startsWith("http")) url = `http://${url}`;
    if (isValidHttpUrl(url)) {
      setLinkEditor(editor, url);
      setIsOpen(false);
      setError(false);
    } else {
      setError(true);
    }
  }, [editor, inputRef, setIsOpen]);

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
        Link
        <Link className="flex-shrink-0 size-3" />
      </button>
      {isOpen && (
        <div className="fixed top-full z-[99999] mt-1 w-60 animate-in fade-in slide-in-from-top-1 rounded bg-custom-background-100 shadow-custom-shadow-rg">
          <div
            className={cn("flex rounded border border-custom-border-300 transition-colors", {
              "border-red-500": error,
            })}
          >
            <input
              ref={inputRef}
              type="url"
              placeholder="Enter or paste a link"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 border-r border-custom-border-300 bg-custom-background-100 py-2 px-1.5 text-xs outline-none placeholder:text-custom-text-400 rounded"
              defaultValue={editor.getAttributes("link").href || ""}
              onKeyDown={(e) => {
                setError(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLinkSubmit();
                }
              }}
              onFocus={() => setError(false)}
              autoFocus
            />
            {editor.getAttributes("link").href ? (
              <button
                type="button"
                className="grid place-items-center rounded-sm p-1 text-red-500 hover:bg-red-500/20 transition-all"
                onClick={(e) => {
                  unsetLinkEditor(editor);
                  setIsOpen(false);
                  e.stopPropagation();
                }}
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                className="h-full aspect-square grid place-items-center p-1 rounded-sm text-custom-text-300 hover:bg-custom-background-80 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLinkSubmit();
                }}
              >
                <Check className="size-4" />
              </button>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 my-1 px-2 pointer-events-none animate-in fade-in slide-in-from-top-0">
              Please enter a valid URL
            </p>
          )}
        </div>
      )}
    </div>
  );
};
