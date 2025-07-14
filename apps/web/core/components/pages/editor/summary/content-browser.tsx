import { useState, useEffect, useCallback } from "react";
// plane imports
import { EditorRefApi, IMarking } from "@plane/editor";
import { cn } from "@plane/utils";
// components
import { OutlineHeading1, OutlineHeading2, OutlineHeading3, THeadingComponentProps } from "./heading-components";

type Props = {
  className?: string;
  emptyState?: React.ReactNode;
  editorRef: EditorRefApi | null;
  setSidePeekVisible?: (sidePeekState: boolean) => void;
  showOutline?: boolean;
};

export const PageContentBrowser: React.FC<Props> = (props) => {
  const { className, editorRef, emptyState, setSidePeekVisible, showOutline = false } = props;
  // states
  const [headings, setHeadings] = useState<IMarking[]>([]);

  useEffect(() => {
    const unsubscribe = editorRef?.onHeadingChange(setHeadings);
    // for initial render of this component to get the editor headings
    setHeadings(editorRef?.getHeadings() ?? []);
    return () => {
      unsubscribe?.();
    };
  }, [editorRef]);

  const handleOnClick = useCallback(
    (marking: IMarking) => {
      editorRef?.scrollSummary(marking);
      setSidePeekVisible?.(false);
    },
    [editorRef, setSidePeekVisible]
  );

  const HeadingComponent: {
    [key: number]: React.FC<THeadingComponentProps>;
  } = {
    1: OutlineHeading1,
    2: OutlineHeading2,
    3: OutlineHeading3,
  };

  if (headings.length === 0) return emptyState ?? null;

  return (
    <div
      className={cn(
        "h-full flex flex-col items-start gap-y-1 mt-2",
        {
          "gap-y-2": showOutline,
        },
        className
      )}
    >
      {headings.map((marking) => {
        const Component = HeadingComponent[marking.level];
        if (!Component) return null;
        if (showOutline === true)
          return (
            <div
              key={`${marking.level}-${marking.sequence}`}
              className="flex-shrink-0 h-0.5 bg-custom-border-400 self-end rounded-sm"
              style={{
                width: marking.level === 1 ? "20px" : marking.level === 2 ? "18px" : "14px",
              }}
            />
          );
        return (
          <Component
            key={`${marking.level}-${marking.sequence}`}
            marking={marking}
            onClick={() => handleOnClick(marking)}
          />
        );
      })}
    </div>
  );
};
