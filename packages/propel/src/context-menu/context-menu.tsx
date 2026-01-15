import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui-components/react/context-menu";
import { cn } from "../utils";

export interface ContextMenuProps extends React.ComponentProps<typeof ContextMenuPrimitive.Root> {
  children: React.ReactNode;
}

export interface ContextMenuTriggerProps extends React.ComponentProps<typeof ContextMenuPrimitive.Trigger> {
  children: React.ReactNode;
  className?: string;
}

export interface ContextMenuContentProps extends React.ComponentProps<typeof ContextMenuPrimitive.Positioner> {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  positionerClassName?: string;
}

export interface ContextMenuItemProps extends React.ComponentProps<typeof ContextMenuPrimitive.Item> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const ContextMenuRoot = React.forwardRef(function ContextMenuRoot(
  { children, ...props }: ContextMenuProps,
  _ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.Root>>
) {
  return <ContextMenuPrimitive.Root {...props}>{children}</ContextMenuPrimitive.Root>;
});

const ContextMenuTrigger = React.forwardRef(function ContextMenuTrigger(
  { className, children, ...props }: ContextMenuTriggerProps,
  ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.Trigger>>
) {
  return (
    <ContextMenuPrimitive.Trigger ref={ref} className={cn("outline-none", className)} {...props}>
      {children}
    </ContextMenuPrimitive.Trigger>
  );
});

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuContent = React.forwardRef(function ContextMenuContent(
  { positionerClassName, className, children, side = "bottom", sideOffset = 4, ...props }: ContextMenuContentProps,
  ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.Positioner>>
) {
  return (
    <ContextMenuPrimitive.Positioner
      ref={ref}
      side={side}
      sideOffset={sideOffset}
      {...props}
      className={positionerClassName}
    >
      <ContextMenuPrimitive.Popup
        className={cn(
          "z-50 min-w-32 overflow-hidden rounded-md border border-subtle bg-surface-1 p-1 shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
      >
        {children}
      </ContextMenuPrimitive.Popup>
    </ContextMenuPrimitive.Positioner>
  );
});

const ContextMenuItem = React.forwardRef(function ContextMenuItem(
  { className, disabled, children, ...props }: ContextMenuItemProps,
  ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.Item>>
) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-xs px-2 py-1.5 text-13 outline-none",
        "focus:bg-surface-2 focus:text-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Item>
  );
});

const ContextMenuSeparator = React.forwardRef(function ContextMenuSeparator(
  { className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>,
  ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.Separator>>
) {
  return (
    <ContextMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-subtle-1", className)} {...props} />
  );
});

const ContextMenuSubmenu = ContextMenuPrimitive.SubmenuRoot;

const ContextMenuSubmenuTrigger = React.forwardRef(function ContextMenuSubmenuTrigger(
  { className, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubmenuTrigger>,
  ref: React.ForwardedRef<React.ElementRef<typeof ContextMenuPrimitive.SubmenuTrigger>>
) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-xs px-2 py-1.5 text-13 outline-none focus:outline-none",
        "focus:bg-surface-2 data-[state=open]:bg-surface-2",
        className
      )}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.SubmenuTrigger>
  );
});

ContextMenuRoot.displayName = "ContextMenu";
ContextMenuTrigger.displayName = "ContextMenuTrigger";
ContextMenuContent.displayName = "ContextMenuContent";
ContextMenuItem.displayName = "ContextMenuItem";
ContextMenuSeparator.displayName = "ContextMenuSeparator";
ContextMenuSubmenuTrigger.displayName = "ContextMenuSubmenuTrigger";

// compound components
const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Portal: ContextMenuPortal,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Submenu: ContextMenuSubmenu,
  SubmenuTrigger: ContextMenuSubmenuTrigger,
});

export { ContextMenu };
