import type { Editor } from "@tiptap/core";
import { LinkViewContainer } from "@/components/editors/link-view-container";

export function LinkContainer({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <LinkViewContainer editor={editor} containerRef={containerRef} />
    </>
  );
}
