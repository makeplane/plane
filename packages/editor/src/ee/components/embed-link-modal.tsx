import {
  autoUpdate,
  flip,
  hide,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  FloatingPortal,
  FloatingOverlay,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/react";
import { FC } from "react";
// storage
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { EmbedLinkView } from "./embed-link-view";

type EmbedLinkModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  virtualElement: Element | null;
  editor: Editor;
};

export const EmbedLinkModal: FC<EmbedLinkModalProps> = ({ isOpen, setIsOpen, virtualElement, editor }) => {
  // hooks
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: virtualElement,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start"],
      }),
      shift({
        padding: 5,
      }),
      hide(),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  // handlers
  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const closeModal = () => {
    setIsOpen(false);
    const storage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
    if (storage) {
      storage.isPasteDialogOpen = false;
      storage.url = "";
    }
  };

  if (!isOpen || !virtualElement) return null;

  // Get stored position where URL was pasted
  const storage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED);
  const { from, to } = storage?.posToInsert || { from: 0, to: 0 };
  const url = storage?.url || "";

  return (
    <FloatingPortal>
      {/* Backdrop */}
      <FloatingOverlay
        lockScroll
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
        style={{ zIndex: 99 }}
      />
      {/* Modal content */}
      <div
        ref={refs.setFloating}
        className="mb-1.5"
        style={{
          ...floatingStyles,
          zIndex: 99,
        }}
        {...getFloatingProps()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <EmbedLinkView url={url} text={url} editor={editor} posToInsert={{ from, to }} closeLinkView={closeModal} />
      </div>
    </FloatingPortal>
  );
};
