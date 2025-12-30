import type { Editor } from "@tiptap/core";

import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import { LinkIcon, TrashIcon, CheckIcon } from "@plane/propel/icons";
// plane imports
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { setLinkEditor, unsetLinkEditor } from "@/helpers/editor-commands";
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";

type Props = {
  editor: Editor;
};

export function BubbleMenuLinkSelector(props: Props) {
  const { editor } = props;
  // states
  const [error, setError] = useState(false);
  // floating ui
  const { options, getReferenceProps, getFloatingProps } = useFloatingMenu({});
  const { context } = options;
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
      context.onOpenChange(false);
      setError(false);
    } else {
      setError(true);
    }
  }, [editor, inputRef, context]);

  return (
    <FloatingMenuRoot
      classNames={{
        buttonContainer: "h-full",
        button: cn(
          "h-full flex items-center gap-1 px-3 text-13 font-medium text-tertiary hover:bg-layer-1 active:bg-layer-1 rounded-sm whitespace-nowrap transition-colors",
          {
            "bg-layer-1": context.open,
            "text-primary": editor.isActive(CORE_EXTENSIONS.CUSTOM_LINK),
          }
        ),
      }}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
      menuButton={
        <>
          Link
          <LinkIcon className="shrink-0 size-3" />
        </>
      }
      options={options}
    >
      <div className="w-60 mt-1 rounded-md bg-surface-1 shadow-raised-200">
        <div
          className={cn("flex rounded-sm  border-[0.5px] border-strong transition-colors", {
            "border-danger-strong": error,
          })}
        >
          <input
            ref={inputRef}
            type="url"
            placeholder="Enter or paste a link"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 border-r-[0.5px] border-strong bg-surface-1 py-2 px-1.5 text-11 outline-none placeholder:text-placeholder rounded-sm"
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
              className="grid place-items-center rounded-xs p-1 text-danger-primary hover:bg-danger-subtle-hover transition-all"
              onClick={(e) => {
                unsetLinkEditor(editor);
                e.stopPropagation();
                context.onOpenChange(false);
              }}
            >
              <TrashIcon className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              className="h-full aspect-square grid place-items-center p-1 rounded-xs text-tertiary hover:bg-layer-1 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleLinkSubmit();
              }}
            >
              <CheckIcon className="size-4" />
            </button>
          )}
        </div>
        {error && (
          <p className="text-11 text-danger-primary my-1 px-2 pointer-events-none animate-in fade-in slide-in-from-top-0">
            Please enter a valid URL
          </p>
        )}
      </div>
    </FloatingMenuRoot>
  );
}
