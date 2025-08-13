"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react";
import * as React from "react";
import { EModalWidth } from "../modals/constants";
import { cn } from "../utils";

function DialogPortal({ ...props }: React.ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-30 bg-custom-backdrop transition-all duration-200 [&[data-ending-style]]:opacity-0 [&[data-starting-style]]:opacity-0",
        className
      )}
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

function DialogPanel({
  className,
  width = EModalWidth.XXL,
  children,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & { width?: EModalWidth }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed flex justify-center top-0 left-0 w-full z-30 px-4 sm:py-20 overflow-y-auto overflow-hidden outline-none"
        )}
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
  );
}

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
