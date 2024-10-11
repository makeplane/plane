"use client";

import { CSSProperties, useState } from "react";
import { observer } from "mobx-react";
// editor
import { EditorRefApi } from "@plane/editor";
// ui
import { TextArea } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnly: boolean;
  title: string;
  updateTitle: (title: string) => void;
};

export const PageEditorTitle: React.FC<Props> = observer((props) => {
  const { editorRef, readOnly, title, updateTitle } = props;
  // states
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  // page filters
  const { fontSize, fontStyle } = usePageFilters();
  // ui
  const titleClassName = cn("bg-transparent tracking-[-2%] font-semibold", {
    "text-[1.6rem] leading-[1.8rem]": fontSize === "small-font",
    "text-[2rem] leading-[2.25rem]": fontSize === "large-font",
  });
  const titleStyle: CSSProperties = {
    fontFamily: fontStyle,
  };

  return (
    <>
      {readOnly ? (
        <h6 className={cn(titleClassName, "break-words")} style={titleStyle}>
          {title}
        </h6>
      ) : (
        <>
          <TextArea
            className={cn(titleClassName, "w-full outline-none p-0 border-none resize-none rounded-none")}
            style={titleStyle}
            placeholder="Untitled"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editorRef.current?.setFocusAtPosition(0);
              }
            }}
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            maxLength={255}
            onFocus={() => setIsLengthVisible(true)}
            onBlur={() => setIsLengthVisible(false)}
            autoFocus
          />
          <div
            className={cn(
              "pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 p-0.5 text-xs text-custom-text-200 opacity-0 transition-opacity",
              {
                "opacity-100": isLengthVisible,
              }
            )}
          >
            <span
              className={cn({
                "text-red-500": title.length > 255,
              })}
            >
              {title.length}
            </span>
            /255
          </div>
        </>
      )}
    </>
  );
});
