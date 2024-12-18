import { useState, useEffect } from "react";
// plane editor
import { EditorRefApi, IMarking } from "@plane/editor";
// components
import { OutlineHeading1, OutlineHeading2, OutlineHeading3 } from "./heading-components";

type Props = {
  editorRef: EditorRefApi | null;
  setSidePeekVisible?: (sidePeekState: boolean) => void;
};

export const PageContentBrowser: React.FC<Props> = (props) => {
  const { editorRef, setSidePeekVisible } = props;
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

  const handleOnClick = (marking: IMarking) => {
    editorRef?.scrollSummary(marking);
    if (setSidePeekVisible) setSidePeekVisible(false);
  };

  const HeadingComponent: {
    [key: number]: React.FC<{ marking: IMarking; onClick: () => void }>;
  } = {
    1: OutlineHeading1,
    2: OutlineHeading2,
    3: OutlineHeading3,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-full flex flex-col items-start gap-y-2 overflow-y-auto mt-2">
        {headings && headings.length !== 0 ? (
          headings.map((marking) => {
            const Component = HeadingComponent[marking.level];
            if (!Component) return null;
            return (
              <Component
                key={`${marking.level}-${marking.sequence}`}
                marking={marking}
                onClick={() => handleOnClick(marking)}
              />
            );
          })
        ) : (
          <p className="mt-3 text-xs text-custom-text-400">Headings will be displayed here for navigation</p>
        )}
      </div>
    </div>
  );
};
