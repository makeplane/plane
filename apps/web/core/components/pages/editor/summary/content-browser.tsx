import { useState, useEffect, useCallback } from "react";
// plane editor
import { EditorRefApi, IMarking } from "@plane/editor";
// components
import { OutlineHeading1, OutlineHeading2, OutlineHeading3 } from "./heading-components";

type Props = {
  editorRef: EditorRefApi | null;
  setSidePeekVisible?: (sidePeekState: boolean) => void;
  showOutline?: boolean;
};

export const PageContentBrowser: React.FC<Props> = (props) => {
  const { editorRef, setSidePeekVisible, showOutline = false } = props;
  // states
  const [headings, setHeadings] = useState<IMarking[]>([]);

  useEffect(() => {
    const unsubscribe = editorRef?.onHeadingChange(setHeadings);
    // for initial render of this component to get the editor headings
    setHeadings(editorRef?.getHeadings() ?? []);
    return () => {
      if (unsubscribe) unsubscribe();
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
    [key: number]: React.FC<{ marking: IMarking; onClick: () => void }>;
  } = {
    1: OutlineHeading1,
    2: OutlineHeading2,
    3: OutlineHeading3,
  };

  return (
    <div className="h-full flex flex-col items-start gap-y-2 overflow-y-auto mt-2">
      {headings.map((marking) => {
        const Component = HeadingComponent[marking.level];
        if (!Component) return null;
        if (showOutline === true)
          return (
            <div
              key={`${marking.level}-${marking.sequence}`}
              className="h-0.5 bg-custom-border-400 self-end rounded-sm"
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
