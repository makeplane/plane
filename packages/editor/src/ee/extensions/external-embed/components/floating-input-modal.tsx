import {
  autoUpdate,
  flip,
  hide,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
// components
import { UpgradeNowModal } from "@/plane-editor/components/modal/upgrade-modal";
import { ExternalEmbedInputView } from "./input-view";
import { ExternalEmbedNodeViewProps } from "@/types";

type ExternalEmbedInputModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  referenceElement: HTMLElement | null;
  externalEmbedProps: ExternalEmbedNodeViewProps;
  isFlagged: boolean;
};

export const ExternalEmbedInputModal: React.FC<ExternalEmbedInputModalProps> = ({
  isOpen,
  setIsOpen,
  referenceElement,
  externalEmbedProps,
  isFlagged,
}) => {
  // hooks
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: referenceElement,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top", "bottom"],
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

  if (!isOpen || !referenceElement) return null;
  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          transform: `${floatingStyles.transform} translateY(6px)`,
        }}
        {...getFloatingProps()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {isFlagged ? (
          <UpgradeNowModal />
        ) : (
          <ExternalEmbedInputView
            style={floatingStyles}
            setIsOpen={setIsOpen}
            externalEmbedProps={externalEmbedProps}
          />
        )}
      </div>
    </FloatingPortal>
  );
};
