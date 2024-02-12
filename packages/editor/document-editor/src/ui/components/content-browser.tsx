import { HeadingComp, HeadingThreeComp, SubheadingComp } from "src/ui/components/heading-component";
import { IMarking } from "src/types/editor-types";
import { Editor } from "@tiptap/react";
import { scrollSummary } from "src/utils/editor-summary-utils";

interface ContentBrowserProps {
  editor: Editor;
  markings: IMarking[];
  setSidePeekVisible?: (sidePeekState: boolean) => void;
}

export const ContentBrowser = (props: ContentBrowserProps) => {
  const { editor, markings, setSidePeekVisible } = props;

  const handleOnClick = (marking: IMarking) => {
    scrollSummary(editor, marking);
    if (setSidePeekVisible) setSidePeekVisible(false);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <h2 className="font-medium">Table of Contents</h2>
      <div className="h-full overflow-y-auto">
        {markings.length !== 0 ? (
          markings.map((marking) =>
            marking.level === 1 ? (
              <HeadingComp onClick={() => handleOnClick(marking)} heading={marking.text} />
            ) : marking.level === 2 ? (
              <SubheadingComp onClick={() => handleOnClick(marking)} subHeading={marking.text} />
            ) : (
              <HeadingThreeComp heading={marking.text} onClick={() => handleOnClick(marking)} />
            )
          )
        ) : (
          <p className="mt-3 text-xs text-custom-text-400">Headings will be displayed here for navigation</p>
        )}
      </div>
    </div>
  );
};
