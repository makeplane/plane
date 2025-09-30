import type { Editor } from "@tiptap/core";
import { Check, Link, Trash2 } from "lucide-react";
import { FC, useCallback, useRef, useState } from "react";
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

export const BubbleMenuLinkSelector: FC<Props> = (props) => {
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
          "h-full flex items-center gap-1 px-3 text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 rounded whitespace-nowrap transition-colors",
          {
            "bg-custom-background-80": context.open,
            "text-custom-text-100": editor.isActive(CORE_EXTENSIONS.CUSTOM_LINK),
          }
        ),
      }}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
      menuButton={
        <>
          Link
          <Link className="shrink-0 size-3" />
        </>
      }
      options={options}
    >
      <div className="w-60 mt-1 rounded-md bg-custom-background-100 shadow-custom-shadow-rg">
        <div
          className={cn("flex rounded  border-[0.5px] border-custom-border-300 transition-colors", {
            "border-red-500": error,
          })}
        >
          <input
            ref={inputRef}
            type="url"
            placeholder="Enter or paste a link"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 border-r-[0.5px] border-custom-border-300 bg-custom-background-100 py-2 px-1.5 text-xs outline-none placeholder:text-custom-text-400 rounded"
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
                e.stopPropagation();
                context.onOpenChange(false);
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
    </FloatingMenuRoot>
  );
};
