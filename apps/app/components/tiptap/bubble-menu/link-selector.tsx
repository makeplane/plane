import { Editor } from "@tiptap/core";
import { Check, Trash } from "lucide-react";
import { Dispatch, FC, SetStateAction, useEffect, useRef } from "react";
import { cn } from "../utils";

interface LinkSelectorProps {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const LinkSelector: FC<LinkSelectorProps> = ({ editor, isOpen, setIsOpen }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current && inputRef.current?.focus();
  });

  return (
    <div className="relative">
      <button
        className={cn("flex h-full items-center space-x-2 px-3 py-1.5 text-sm font-medium text-custom-text-300 hover:bg-custom-background-100 active:bg-custom-background-100", { "bg-custom-background-100": isOpen })}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <p className="text-base">↗</p>
        <p
          className={cn("underline underline-offset-4", {
            "text-custom-text-100": editor.isActive("link"),
          })}
        >
          Link
        </p>
      </button>
      {isOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements[0] as HTMLInputElement;
            editor.chain().focus().setLink({ href: input.value }).run();
            setIsOpen(false);
          }}
          className="fixed top-full z-[99999] mt-1 flex w-60 overflow-hidden rounded border border-custom-border-300 bg-custom-background-100 dow-xl animate-in fade-in slide-in-from-top-1"
        >
          <input
            ref={inputRef}
            type="url"
            placeholder="Paste a link"
            className="flex-1 bg-custom-background-100 border border-custom-primary-300 p-1 text-sm outline-none placeholder:text-custom-text-400"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <button
              className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setIsOpen(false);
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          ) : (
            <button className="flex items-center rounded-sm p-1 text-custom-text-300 transition-all hover:bg-custom-background-90">
              <Check className="h-4 w-4" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};
