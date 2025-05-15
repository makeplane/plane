import { Editor } from "@tiptap/core";
import { LinkViewContainer } from "@/components/editors/link-view-container";

export const LinkContainer = ({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}) => (
  <>
    <LinkViewContainer editor={editor} containerRef={containerRef} />
  </>
);
