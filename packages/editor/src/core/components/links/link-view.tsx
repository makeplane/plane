import { Editor } from "@tiptap/react";
import { CSSProperties, useEffect, useState } from "react";
// components
import { LinkEditView, LinkPreview } from "@/components/links";

export type LinkViews = "LinkPreview" | "LinkEditView";

export interface LinkViewProps {
  view?: LinkViews;
  editor: Editor;
  from: number;
  to: number;
  url: string;
  text?: string;
  closeLinkView: () => void;
}

export const LinkView = (props: LinkViewProps & { style: CSSProperties }) => {
  const [currentView, setCurrentView] = useState<LinkViews>(props.view ?? "LinkPreview");
  const [prevFrom, setPrevFrom] = useState(props.from);

  const switchView = (view: LinkViews) => {
    setCurrentView(view);
  };

  useEffect(() => {
    if (props.from !== prevFrom) {
      setCurrentView("LinkPreview");
      setPrevFrom(props.from);
    }
  }, []);

  return (
    <>
      {currentView === "LinkPreview" && <LinkPreview viewProps={props} switchView={switchView} />}
      {currentView === "LinkEditView" && <LinkEditView viewProps={props} switchView={switchView} />}
    </>
  );
};
