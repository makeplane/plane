import {
  autoUpdate,
  flip,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  FloatingOverlay,
  FloatingPortal,
} from "@floating-ui/react";
import { FC, useEffect } from "react";
// types
import { UpgradeNowModal } from "@/plane-editor/components/modal/upgrade-modal";
import { TMathModalBaseProps } from "../types";
// components
import { MathInputModal } from "./input-modal";

type TFloatingMathModalProps = TMathModalBaseProps & {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  referenceElement: HTMLElement | null;
  onPreview?: (latex: string, isValid: boolean, errorMessage?: string) => void;
  isFlagged?: boolean;
};
export const FloatingMathModal: FC<TFloatingMathModalProps> = ({
  isOpen,
  setIsOpen,
  referenceElement,
  latex,
  onSave,
  onClose,
  onPreview,
  nodeType,
  editor,
  getPos,
  isFlagged,
}) => {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: referenceElement,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
      }),
      shift({
        padding: 8,
      }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !referenceElement) return null;

  return (
    <FloatingPortal>
      {/* Backdrop */}
      <FloatingOverlay
        lockScroll
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        style={{ zIndex: 99 }}
      />

      {/* Modal content */}
      <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 100 }} {...getFloatingProps()}>
        {isFlagged ? (
          <UpgradeNowModal />
        ) : (
          <MathInputModal
            latex={latex}
            onSave={onSave}
            onClose={onClose}
            onPreview={onPreview}
            nodeType={nodeType}
            editor={editor}
            getPos={getPos}
          />
        )}
      </div>
    </FloatingPortal>
  );
};
