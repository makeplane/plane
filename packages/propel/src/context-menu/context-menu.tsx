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
}

export interface ContextMenuItemProps extends React.ComponentProps<typeof ContextMenuPrimitive.Item> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const ContextMenuRoot = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Root>, ContextMenuProps>(
  ({ children, ...props }, _ref) => <ContextMenuPrimitive.Root {...props}>{children}</ContextMenuPrimitive.Root>
);

const ContextMenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Trigger>,
  ContextMenuTriggerProps
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.Trigger ref={ref} className={cn("outline-none", className)} {...props}>
    {children}
  </ContextMenuPrimitive.Trigger>
));

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Positioner>,
  ContextMenuContentProps
>(({ className, children, side = "bottom", sideOffset = 4, ...props }, ref) => (
  <ContextMenuPrimitive.Positioner ref={ref} side={side} sideOffset={sideOffset} {...props}>
    <ContextMenuPrimitive.Popup
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100 p-1 shadow-md",
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
));

const ContextMenuItem = React.forwardRef<React.ElementRef<typeof ContextMenuPrimitive.Item>, ContextMenuItemProps>(
  ({ className, disabled, children, ...props }, ref) => (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-custom-background-90 focus:text-custom-text-100",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Item>
  )
);

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentProps<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-custom-border-200", className)}
    {...props}
  />
));

const ContextMenuSubmenu = ContextMenuPrimitive.SubmenuRoot;

const ContextMenuSubmenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubmenuTrigger>,
  React.ComponentProps<typeof ContextMenuPrimitive.SubmenuTrigger>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubmenuTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:outline-none",
      "focus:bg-custom-background-90 data-[state=open]:bg-custom-background-90",
      className
    )}
    {...props}
  >
    {children}
  </ContextMenuPrimitive.SubmenuTrigger>
));

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
