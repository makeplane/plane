import type { Editor } from "@tiptap/react";
import { ALargeSmall, Ban } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";
// local imports
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";
import { BackgroundColorItem, TextColorItem } from "../menu-items";
import type { EditorStateType } from "./root";

type Props = {
  editor: Editor;
  editorState: EditorStateType;
};

export function BubbleMenuColorSelector(props: Props) {
  const { editor, editorState } = props;
  // floating ui
  const { options, getReferenceProps, getFloatingProps } = useFloatingMenu({});

  const activeTextColor = useMemo(() => editorState.color, [editorState.color]);
  const activeBackgroundColor = useMemo(() => editorState.backgroundColor, [editorState.backgroundColor]);

  return (
    <FloatingMenuRoot
      classNames={{
        buttonContainer: "h-full",
        button:
          "flex items-center gap-1 h-full whitespace-nowrap px-3 text-13 font-medium text-tertiary hover:bg-layer-1 active:bg-layer-1 rounded-sm transition-colors",
      }}
      menuButton={
        <>
          <span>Color</span>
          <span
            className={cn("flex-shrink-0 size-6 grid place-items-center rounded-sm border-[0.5px] border-strong", {
              "bg-surface-1": !activeBackgroundColor,
            })}
            style={{
              backgroundColor: activeBackgroundColor ? activeBackgroundColor.backgroundColor : "transparent",
            }}
          >
            <ALargeSmall
              className={cn("size-3.5", {
                "text-primary": !activeTextColor,
              })}
              style={{
                color: activeTextColor ? activeTextColor.textColor : "inherit",
              }}
            />
          </span>
        </>
      }
      options={options}
      getFloatingProps={getFloatingProps}
      getReferenceProps={getReferenceProps}
    >
      <section className="mt-1 rounded-md border-[0.5px] border-strong bg-surface-1 p-2 space-y-2 shadow-raised-200">
        <div className="space-y-1.5">
          <p className="text-11 text-tertiary font-semibold">Text colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => TextColorItem(editor).command({ color: color.key })}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-1 transition-colors"
              onClick={() => TextColorItem(editor).command({ color: undefined })}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-11 text-tertiary font-semibold">Background colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => BackgroundColorItem(editor).command({ color: color.key })}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-1 transition-colors"
              onClick={() => BackgroundColorItem(editor).command({ color: undefined })}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </FloatingMenuRoot>
  );
}
