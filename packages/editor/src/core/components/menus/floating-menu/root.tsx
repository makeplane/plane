import { FloatingOverlay, FloatingPortal } from "@floating-ui/react";
import type { UseInteractionsReturn, UseFloatingReturn } from "@floating-ui/react";

type Props = {
  children: React.ReactNode;
  classNames?: {
    buttonContainer?: string;
    button?: string;
  };
  getFloatingProps: UseInteractionsReturn["getFloatingProps"];
  getReferenceProps: UseInteractionsReturn["getReferenceProps"];
  menuButton: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  options: UseFloatingReturn;
};

export function FloatingMenuRoot(props: Props) {
  const { children, classNames, getFloatingProps, getReferenceProps, menuButton, onClick, options } = props;
  // derived values
  const { refs, floatingStyles, context } = options;

  return (
    <>
      <div className={classNames?.buttonContainer}>
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          type="button"
          className={classNames?.button}
          onClick={(e) => {
            context.onOpenChange(!context.open);
            onClick?.(e);
          }}
        >
          {menuButton}
        </button>
      </div>
      {context.open && (
        <FloatingPortal>
          {/* Backdrop */}
          <FloatingOverlay
            style={{
              zIndex: 99,
            }}
            lockScroll
          />
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              zIndex: 100,
            }}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
