// types
import { EditorRefApi, IMarking } from "@plane/document-editor";
import { HeadingComp, HeadingThreeComp, SubheadingComp } from "./heading-components";

type Props = {
  editorRef: EditorRefApi;
  markings: IMarking[];
  setSidePeekVisible?: (sidePeekState: boolean) => void;
};

export const PageContentBrowser: React.FC<Props> = (props) => {
  const { editorRef, markings, setSidePeekVisible } = props;

  const handleOnClick = (marking: IMarking) => {
    editorRef?.scrollSummary(marking);
    if (setSidePeekVisible) setSidePeekVisible(false);
  };
  console.log("length of markings", markings.length);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <h2 className="font-medium">Outline</h2>
      <div className="h-full overflow-y-auto">
        {markings.length !== 0 ? (
          markings.map((marking) =>
            marking.level === 1 ? (
              <HeadingComp
                key={`${marking.level}-${marking.sequence}`}
                onClick={() => handleOnClick(marking)}
                heading={marking.text}
              />
            ) : marking.level === 2 ? (
              <SubheadingComp
                key={`${marking.level}-${marking.sequence}`}
                onClick={() => handleOnClick(marking)}
                subHeading={marking.text}
              />
            ) : (
              <HeadingThreeComp
                key={`${marking.level}-${marking.sequence}`}
                heading={marking.text}
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
