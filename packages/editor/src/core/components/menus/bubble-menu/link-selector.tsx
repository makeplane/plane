import { Popover } from "@headlessui/react";
import { Editor } from "@tiptap/core";
import { Check, Link, Trash2 } from "lucide-react";
import { FC, useCallback, useRef, useState, Dispatch, SetStateAction } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
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
    const url = input.value;
    if (!url) return;
    const { isValid, url: validatedUrl } = isValidHttpUrl(url);
    if (isValid) {
      setLinkEditor(editor, validatedUrl);
      setIsOpen(false);
      setError(false);
    } else {
      setError(true);
    }
  }, [editor, inputRef, setIsOpen]);

  return (
    <Popover as="div" className="h-7 px-2">
      <Popover.Button
        as="button"
        type="button"
        className={cn("h-full", {
          "outline-none": isOpen,
        })}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          className={cn(
            "h-full px-2 text-custom-text-300 text-sm flex items-center gap-1.5 rounded hover:bg-custom-background-80",
            {
              "text-custom-text-100 bg-custom-background-80": isOpen || editor.isActive(CORE_EXTENSIONS.CUSTOM_LINK),
            }
          )}
        >
          Link
          <Link className="flex-shrink-0 size-3" />
        </span>
      </Popover.Button>
      <Popover.Panel as="div" className="fixed z-20 mt-1 w-60 rounded bg-custom-background-100 shadow-custom-shadow-rg">
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
        {error && <p className="text-xs text-red-500 my-1 px-2 pointer-events-none">Please enter a valid URL</p>}
      </Popover.Panel>
    </Popover>
  );
};
