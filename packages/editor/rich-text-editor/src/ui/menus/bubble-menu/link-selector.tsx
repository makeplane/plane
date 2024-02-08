import { Editor } from "@tiptap/core";
import { Check, Trash } from "lucide-react";
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef } from "react";
import { cn, isValidHttpUrl, setLinkEditor, unsetLinkEditor } from "@plane/editor-core";

interface LinkSelectorProps {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const LinkSelector: FC<LinkSelectorProps> = ({ editor, isOpen, setIsOpen }) => {
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
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex h-full items-center space-x-2 px-3 py-1.5 text-sm font-medium text-neutral-text-medium hover:bg-neutral-component-surface-light active:bg-neutral-component-surface-light",
          { "bg-neutral-component-surface-light": isOpen }
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <p className="text-base">↗</p>
        <p
          className={cn("underline underline-offset-4", {
            "text-neutral-text-strong": editor.isActive("link"),
          })}
        >
          Link
        </p>
      </button>
      {isOpen && (
        <div
          className="dow-xl fixed top-full z-[99999] mt-1 flex w-60 overflow-hidden rounded border border-neutral-border-medium bg-neutral-component-surface-light animate-in fade-in slide-in-from-top-1"
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
            className="flex-1 border-r border-neutral-border-medium bg-neutral-component-surface-light p-1 text-sm outline-none placeholder:text-neutral-text-subtle"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <button
              type="button"
              className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
              onClick={() => {
                unsetLinkEditor(editor);
                setIsOpen(false);
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="flex items-center rounded-sm p-1 text-neutral-text-medium transition-all hover:bg-neutral-component-surface-medium"
              type="button"
              onClick={() => {
                onLinkSubmit();
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
