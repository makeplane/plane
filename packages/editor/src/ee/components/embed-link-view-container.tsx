import { Editor, useEditorState } from "@tiptap/react";
import { FC, useEffect, useRef, useState } from "react";
// storage
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// components
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { EmbedLinkModal } from "./embed-link-modal";

type LinkViewContainerProps = {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
};

export const EmbedLinkViewContainer: FC<LinkViewContainerProps> = ({ editor, containerRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [virtualElement, setVirtualElement] = useState<Element | null>(null);
  const lastPosRef = useRef<{ from: number; to: number } | null>(null);

  // Watch for when modal should open
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      embedExtensionStorage: getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED),
      storageSnapshot: JSON.stringify(editor.storage.externalEmbedComponent || {}),
    }),
  });

  const closeModal = () => {
    setIsOpen(false);
    const storage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
    if (storage) {
      storage.isPasteDialogOpen = false;
      storage.url = "";
    }
  };

  // Set up the modal when appropriate
  useEffect(() => {
    const storageToUse = editorState.embedExtensionStorage;

    if (storageToUse?.isPasteDialogOpen && editor && storageToUse?.posToInsert) {
      const { from, to } = storageToUse.posToInsert;
      lastPosRef.current = { from, to };

      const domNodeAtPos = editor.view.nodeDOM(from);
      const targetElement =
        domNodeAtPos instanceof HTMLElement ? domNodeAtPos.closest("a") : domNodeAtPos?.parentElement?.closest("a");

      if (!targetElement) {
        closeModal();
        return;
      }

      // Create a virtual element positioned after the link end
      const linkRect = targetElement.getBoundingClientRect();
      const virtualRect = {
        x: linkRect.right + 4, // 4px gap after the link
        y: linkRect.top,
        width: 0,
        height: linkRect.height,
        top: linkRect.top,
        left: linkRect.right + 4,
        right: linkRect.right + 4,
        bottom: linkRect.bottom,
      };

      const virtualElement = {
        getBoundingClientRect: () => virtualRect,
      };

      setVirtualElement(virtualElement as Element);
      setIsOpen(true);
    } else if (!storageToUse?.isPasteDialogOpen) {
      setIsOpen(false);
      setVirtualElement(null);
    }
  }, [editorState.embedExtensionStorage, editorState.storageSnapshot, editor]);

  if (!isOpen || !virtualElement) return null;

  return <EmbedLinkModal isOpen={isOpen} setIsOpen={setIsOpen} virtualElement={virtualElement} editor={editor} />;
};
