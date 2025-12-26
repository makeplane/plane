import { useState } from "react";
import { observer } from "mobx-react";
// editor
import type { EditorRefApi } from "@plane/editor";
// ui
import { TextArea } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// helpers
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";

type Props = {
  editorRef: EditorRefApi | null;
  readOnly: boolean;
  title: string | undefined;
  updateTitle: (title: string) => void;
};

export const PageEditorTitle = observer(function PageEditorTitle(props: Props) {
  const { editorRef, readOnly, title, updateTitle } = props;
  // states
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  // page filters
  const { fontSize } = usePageFilters();
  // ui
  const titleFontClassName = cn("tracking-[-2%] font-bold", {
    "text-[1.6rem] leading-[1.9rem]": fontSize === "small-font",
    "text-[2rem] leading-[2.375rem]": fontSize === "large-font",
  });

  return (
    <div className="relative w-full flex-shrink-0 py-3">
      {readOnly ? (
        <h6
          className={cn(
            titleFontClassName,
            {
              "text-placeholder": !title,
            },
            "break-words"
          )}
        >
          {getPageName(title)}
        </h6>
      ) : (
        <div className="relative">
          <TextArea
            className={cn(titleFontClassName, "block w-full border-none outline-none p-0 resize-none rounded-none")}
            placeholder="Untitled"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editorRef?.setFocusAtPosition(0);
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
              "pointer-events-none absolute bottom-1 right-1 z-[2] font-regular rounded-sm bg-surface-1 p-0.5 text-11 text-secondary opacity-0 transition-opacity",
              {
                "opacity-100": isLengthVisible,
              }
            )}
          >
            <span
              className={cn({
                "text-danger-primary": title && title.length > 255,
              })}
            >
              {title?.length}
            </span>
            /255
          </div>
        </div>
      )}
    </div>
  );
});
