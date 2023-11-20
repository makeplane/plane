import { HeadingComp, SubheadingComp } from "./heading-component";
import { IMarking } from "..";
import { Editor } from "@tiptap/react";
import { scrollSummary } from "../utils/editor-summary-utils";

interface ContentBrowserProps {
  editor: Editor;
  markings: IMarking[];
}

export const ContentBrowser = ({
  editor,
  markings,
}: ContentBrowserProps) => (
  <div className="mt-4 flex w-[250px] flex-col h-full">
    <h2 className="ml-4 border-b border-solid border-custom-border py-5 font-medium leading-[85.714%] tracking-tight max-md:ml-2.5">
      Table of Contents
    </h2>
    <div className="mt-3 h-0.5 w-full self-stretch border-custom-border" />
    {markings.length !== 0 ? (
      markings.map((marking) =>
        marking.level === 1 ? (
          <HeadingComp
            onClick={() => scrollSummary(editor, marking)}
            heading={marking.text}
          />
        ) : (
          <SubheadingComp
            onClick={() => scrollSummary(editor, marking)}
            subHeading={marking.text}
          />
        )
      )
    ) : (
      <p className="ml-3 mr-3 flex h-full items-center px-5 text-center text-xs text-gray-500">
        {"Headings will be displayed here for Navigation"}
      </p>
    )}
  </div>
);
