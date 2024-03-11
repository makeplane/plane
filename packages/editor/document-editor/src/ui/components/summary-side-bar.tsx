import { Editor } from "@tiptap/react";
import { IMarking } from "src/types/editor-types";
import { ContentBrowser } from "src/ui/components/content-browser";

interface ISummarySideBarProps {
  editor: Editor;
  markings: IMarking[];
  sidePeekVisible: boolean;
}

export const SummarySideBar = ({ editor, markings, sidePeekVisible }: ISummarySideBarProps) => (
  <div
    className={`h-full transform overflow-hidden p-5 transition-all duration-200 ${
      sidePeekVisible ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <ContentBrowser editor={editor} markings={markings} />
  </div>
);
