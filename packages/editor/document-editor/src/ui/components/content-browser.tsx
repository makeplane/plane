import { HeadingComp, HeadingThreeComp, SubheadingComp } from "src/ui/components/heading-component";
import { IMarking } from "src/types/editor-types";
import { Editor } from "@tiptap/react";
import { scrollSummary } from "src/utils/editor-summary-utils";

interface ContentBrowserProps {
  editor: Editor;
  markings: IMarking[];
}

export const ContentBrowser = (props: ContentBrowserProps) => {
  const { editor, markings } = props;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <h2 className="font-medium">Table of Contents</h2>
      <div className="h-full overflow-y-auto">
        {markings.length !== 0 ? (
          markings.map((marking) =>
            marking.level === 1 ? (
              <HeadingComp onClick={() => scrollSummary(editor, marking)} heading={marking.text} />
            ) : marking.level === 2 ? (
              <SubheadingComp onClick={() => scrollSummary(editor, marking)} subHeading={marking.text} />
            ) : (
              <HeadingThreeComp heading={marking.text} onClick={() => scrollSummary(editor, marking)} />
            )
          )
        ) : (
          <p className="mt-3 text-xs text-custom-text-400">Headings will be displayed here for navigation</p>
        )}
      </div>
    </div>
  );
};
