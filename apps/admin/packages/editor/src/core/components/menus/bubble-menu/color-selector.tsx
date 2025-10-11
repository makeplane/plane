import type { Editor } from "@tiptap/react";
import { ALargeSmall, Ban } from "lucide-react";
import { useMemo, type FC } from "react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { COLORS_LIST } from "@/constants/common";
// local imports
import { FloatingMenuRoot } from "../floating-menu/root";
import { useFloatingMenu } from "../floating-menu/use-floating-menu";
import { BackgroundColorItem, TextColorItem } from "../menu-items";
import { EditorStateType } from "./root";

type Props = {
  editor: Editor;
  editorState: EditorStateType;
};

export const BubbleMenuColorSelector: FC<Props> = (props) => {
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
          "flex items-center gap-1 h-full whitespace-nowrap px-3 text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 active:bg-custom-background-80 rounded transition-colors",
      }}
      menuButton={
        <>
          <span>Color</span>
          <span
            className={cn(
              "flex-shrink-0 size-6 grid place-items-center rounded border-[0.5px] border-custom-border-300",
              {
                "bg-custom-background-100": !activeBackgroundColor,
              }
            )}
            style={{
              backgroundColor: activeBackgroundColor ? activeBackgroundColor.backgroundColor : "transparent",
            }}
          >
            <ALargeSmall
              className={cn("size-3.5", {
                "text-custom-text-100": !activeTextColor,
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
      <section className="mt-1 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 p-2 space-y-2 shadow-custom-shadow-rg">
        <div className="space-y-1.5">
          <p className="text-xs text-custom-text-300 font-semibold">Text colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded border-[0.5px] border-custom-border-400 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.textColor,
                }}
                onClick={() => TextColorItem(editor).command({ color: color.key })}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-300 border-[0.5px] border-custom-border-400 hover:bg-custom-background-80 transition-colors"
              onClick={() => TextColorItem(editor).command({ color: undefined })}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-custom-text-300 font-semibold">Background colors</p>
          <div className="flex items-center gap-2">
            {COLORS_LIST.map((color) => (
              <button
                key={color.key}
                type="button"
                className="flex-shrink-0 size-6 rounded border-[0.5px] border-custom-border-400 hover:opacity-60 transition-opacity"
                style={{
                  backgroundColor: color.backgroundColor,
                }}
                onClick={() => BackgroundColorItem(editor).command({ color: color.key })}
              />
            ))}
            <button
              type="button"
              className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-300 border-[0.5px] border-custom-border-400 hover:bg-custom-background-80 transition-colors"
              onClick={() => BackgroundColorItem(editor).command({ color: undefined })}
            >
              <Ban className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </FloatingMenuRoot>
  );
};
