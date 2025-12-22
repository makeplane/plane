import { Disclosure } from "@headlessui/react";
import type { Editor } from "@tiptap/core";
import { Ban, Palette } from "lucide-react";
// plane imports
import { ChevronRightIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";

// TODO: implement text color selector

type Props = {
  editor: Editor;
  onSelect: (color: string | null) => void;
};

const handleBackgroundColorChange = (editor: Editor, color: string | null) => {
  editor
    .chain()
    .focus()
    .updateAttributes(CORE_EXTENSIONS.TABLE_CELL, {
      background: color,
    })
    .run();
};

// const handleTextColorChange = (editor: Editor, color: string | null) => {
//   editor
//     .chain()
//     .focus()
//     .updateAttributes(CORE_EXTENSIONS.TABLE_CELL, {
//       textColor: color,
//     })
//     .run();
// };

export function TableDragHandleDropdownColorSelector(props: Props) {
  const { editor, onSelect } = props;

  return (
    <Disclosure defaultOpen>
      <Disclosure.Button
        as="button"
        type="button"
        className="flex items-center justify-between gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1"
      >
        {({ open }) => (
          <>
            <span className="flex items-center gap-2">
              <Palette className="shrink-0 size-3" />
              Color
            </span>
            <ChevronRightIcon
              className={cn("shrink-0 size-3 transition-transform duration-200", {
                "rotate-90": open,
              })}
            />
          </>
        )}
      </Disclosure.Button>
      <Disclosure.Panel className="p-1 space-y-2 mb-1.5">
        {/* <div className="space-y-1.5">
          <p className="text-11 text-tertiary font-semibold">Text colors</p>
          <div className="flex items-center flex-wrap gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => handleTextColorChange(editor, color.textColor)}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-1 transition-colors"
              onClick={() => handleTextColorChange(editor, null)}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div> */}
        <div className="space-y-1">
          <p className="text-11 text-tertiary font-semibold">Background colors</p>
          <div className="flex items-center flex-wrap gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => {
                  handleBackgroundColorChange(editor, color.backgroundColor);
                  onSelect(color.backgroundColor);
                }}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-1-hover transition-colors"
              onClick={() => {
                handleBackgroundColorChange(editor, null);
                onSelect(null);
              }}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
      </Disclosure.Panel>
    </Disclosure>
  );
}
