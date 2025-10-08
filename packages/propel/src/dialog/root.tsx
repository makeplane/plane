"use client";

import { forwardRef, memo, useMemo } from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react";
import { cn } from "../utils/classname";

// enums

export enum EDialogWidth {
  SM = "sm:max-w-sm",
  MD = "sm:max-w-md",
  LG = "sm:max-w-lg",
  XL = "sm:max-w-xl",
  XXL = "sm:max-w-2xl",
  XXXL = "sm:max-w-3xl",
  XXXXL = "sm:max-w-4xl",
  VXL = "sm:max-w-5xl",
  VIXL = "sm:max-w-6xl",
  VIIXL = "sm:max-w-7xl",
}

// Types
export type DialogPosition = "center" | "top";

export interface DialogProps extends React.ComponentProps<typeof BaseDialog.Root> {
  children: React.ReactNode;
}

export interface DialogPanelProps extends React.ComponentProps<typeof BaseDialog.Popup> {
  width?: EDialogWidth;
  position?: DialogPosition;
  children: React.ReactNode;
}

export interface DialogTitleProps extends React.ComponentProps<typeof BaseDialog.Title> {
  children: React.ReactNode;
}

// Constants
const OVERLAY_CLASSNAME = cn("fixed inset-0 z-backdrop bg-custom-backdrop");
const BASE_CLASSNAME = "relative text-left bg-custom-background-100 rounded-lg shadow-md w-full z-modal";

// Utility functions
const getPositionClassNames = (position: DialogPosition) =>
  cn("isolate fixed z-modal", {
    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2": position === "center",
    "top-8 left-1/2 -translate-x-1/2": position === "top",
  });

const DialogPortal = memo<React.ComponentProps<typeof BaseDialog.Portal>>(({ children, ...props }) => (
  <BaseDialog.Portal data-slot="dialog-portal" {...props}>
    {children}
  </BaseDialog.Portal>
));
DialogPortal.displayName = "DialogPortal";

const DialogOverlay = memo<React.ComponentProps<typeof BaseDialog.Backdrop>>(({ className, ...props }) => (
  <BaseDialog.Backdrop data-slot="dialog-overlay" className={cn(OVERLAY_CLASSNAME, className)} {...props} />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogComponent = memo<DialogProps>(({ children, ...props }) => (
  <BaseDialog.Root data-slot="dialog" {...props}>
    {children}
  </BaseDialog.Root>
));
DialogComponent.displayName = "Dialog";

const DialogTrigger = memo<React.ComponentProps<typeof BaseDialog.Trigger>>(({ children, ...props }) => (
  <BaseDialog.Trigger data-slot="dialog-trigger" {...props}>
    {children}
  </BaseDialog.Trigger>
));
DialogTrigger.displayName = "DialogTrigger";

const DialogPanel = forwardRef<React.ElementRef<typeof BaseDialog.Popup>, DialogPanelProps>(
  ({ className, width = EDialogWidth.XXL, children, position = "center", ...props }, ref) => {
    const positionClassNames = useMemo(() => getPositionClassNames(position), [position]);
    return (
      <DialogPortal>
        <DialogOverlay />
        <BaseDialog.Popup
          ref={ref}
          data-slot="dialog-content"
          className={cn(BASE_CLASSNAME, positionClassNames, width, className)}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {children}
        </BaseDialog.Popup>
      </DialogPortal>
    );
  }
);
DialogPanel.displayName = "DialogPanel";

const DialogTitle = memo<DialogTitleProps>(({ className, children, ...props }) => (
  <BaseDialog.Title data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props}>
    {children}
  </BaseDialog.Title>
));

DialogTitle.displayName = "DialogTitle";

// Create the compound Dialog component with proper typing
const Dialog = Object.assign(DialogComponent, {
  Panel: DialogPanel,
  Title: DialogTitle,
}) as typeof DialogComponent & {
  Panel: typeof DialogPanel;
  Title: typeof DialogTitle;
};

export { Dialog, DialogTitle, DialogPanel };
