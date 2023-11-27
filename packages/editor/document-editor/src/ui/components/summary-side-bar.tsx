import { Editor } from "@tiptap/react";
import { IMarking } from "..";
import { ContentBrowser } from "./content-browser";

interface ISummarySideBarProps {
  editor: Editor;
  markings: IMarking[];
  sidePeekVisible: boolean;
}

export const SummarySideBar = ({
  editor,
  markings,
  sidePeekVisible,
}: ISummarySideBarProps) => {
  return (
    <div
      className={`h-full p-5 transition-all duration-200 transform overflow-hidden ${
        sidePeekVisible ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <ContentBrowser editor={editor} markings={markings} />
    </div>
  );
};
