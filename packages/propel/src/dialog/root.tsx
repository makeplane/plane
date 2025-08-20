"use client";

import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui-components/react";
import { cn } from "@plane/utils";
import { EDialogWidth } from "./constants";

function DialogPortal({ ...props }: React.ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-backdrop bg-custom-backdrop", className)}
      {...props}
    />
  );
}

function Dialog({ ...props }: React.ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />;
}

const DialogPanel = React.forwardRef<
  React.ElementRef<typeof BaseDialog.Popup>,
  React.ComponentProps<typeof BaseDialog.Popup> & { width?: EDialogWidth }
>(({ className, width = EDialogWidth.XXL, children, ...props }, ref) => (
  <DialogPortal data-slot="dialog-portal">
    <DialogOverlay />
    <BaseDialog.Popup
      ref={ref}
      data-slot="dialog-content"
      className="isolate fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-custom-background-100 border border-border rounded-lg shadow-lg p-6 w-full max-w-md z-modal"
      {...props}
    >
      <div
        className={cn(
          "rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all w-full",
          width,
          className
        )}
      >
        {children}
      </div>
    </BaseDialog.Popup>
  </DialogPortal>
));

function DialogTitle({ className, ...props }: React.ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}
// compound components
Dialog.Trigger = DialogTrigger;
Dialog.Panel = DialogPanel;
Dialog.Title = DialogTitle;

export { Dialog, DialogTitle, DialogTrigger, DialogPanel };
