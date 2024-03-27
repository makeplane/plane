// types
import { EditorReadOnlyRefApi, EditorRefApi, IMarking } from "@plane/document-editor";
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <h2 className="font-medium">Outline</h2>
      <div className="h-full overflow-y-auto">
        {markings.length !== 0 ? (
          markings.map((marking) =>
            marking.level === 1 ? (
              <OutlineHeading1
                key={`${marking.level}-${marking.sequence}`}
                marking={marking}
                onClick={() => handleOnClick(marking)}
              />
            ) : marking.level === 2 ? (
              <OutlineHeading2
                key={`${marking.level}-${marking.sequence}`}
                marking={marking}
                onClick={() => handleOnClick(marking)}
              />
            ) : (
              <OutlineHeading3
                key={`${marking.level}-${marking.sequence}`}
                marking={marking}
                onClick={() => handleOnClick(marking)}
              />
            )
          )
        ) : (
          <p className="mt-3 text-xs text-custom-text-400">Headings will be displayed here for navigation</p>
        )}
      </div>
    </div>
  );
};
