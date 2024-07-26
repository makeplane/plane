// types
import { EditorReadOnlyRefApi, EditorRefApi, IMarking } from "@plane/editor";
import { OutlineHeading1, OutlineHeading2, OutlineHeading3 } from "./heading-components";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  markings: IMarking[];
  setSidePeekVisible?: (sidePeekState: boolean) => void;
};

export const PageContentBrowser: React.FC<Props> = (props) => {
  const { editorRef, markings, setSidePeekVisible } = props;

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
        {markings.length !== 0 ? (
          markings.map((marking) => {
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
