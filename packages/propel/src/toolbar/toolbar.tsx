import * as React from "react";
import type { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "../icons";
import { Tooltip } from "../tooltip";
import { cn } from "../utils";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface ToolbarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isFirst?: boolean;
}

export interface ToolbarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon | React.FC<ISvgIcons>;
  isActive?: boolean;
  tooltip?: string;
  shortcut?: string[];
  className?: string;
  children?: React.ReactNode;
}

export interface ToolbarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface ToolbarSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  className?: string;
  children: React.ReactNode;
}

const ToolbarRoot = React.forwardRef(function ToolbarRoot(
  { className, children, ...props }: ToolbarProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn("flex h-9 w-full items-stretch gap-1.5 bg-surface-2 overflow-x-scroll", className)}
      {...props}
    >
      {children}
    </div>
  );
});

const ToolbarGroup = React.forwardRef(function ToolbarGroup(
  { className, children, isFirst = false, ...props }: ToolbarGroupProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-stretch gap-0.5 border-r border-subtle px-2.5",
        {
          "pl-0": isFirst,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const ToolbarItem = React.forwardRef(function ToolbarItem(
  { icon: Icon, isActive = false, tooltip, shortcut, className, children, ...props }: ToolbarItemProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const button = (
    <button
      ref={ref}
      type="button"
      className={cn(
        "grid place-items-center aspect-square rounded-xs p-0.5 text-placeholder hover:bg-layer-1 transition-colors",
        {
          "bg-layer-1 text-primary": isActive,
        },
        className
      )}
      {...props}
    >
      <Icon
        className={cn("h-3.5 w-3.5", {
          "text-primary": isActive,
        })}
        strokeWidth={2.5}
      />
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip
        tooltipContent={
          <div className="flex flex-col gap-1 text-center text-11">
            <span className="font-medium">{tooltip}</span>
            {shortcut && <kbd className="text-placeholder">{shortcut.join(" + ")}</kbd>}
          </div>
        }
      >
        {button}
      </Tooltip>
    );
  }

  return button;
});

const ToolbarSeparator = React.forwardRef(function ToolbarSeparator(
  { className, ...props }: ToolbarSeparatorProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return <div ref={ref} className={cn("h-full w-px bg-subtle-1 mx-1", className)} {...props} />;
});

const buttonVariants = {
  primary: "bg-accent-primary text-on-color hover:bg-accent-primary/80 focus:bg-accent-primary/80",
  secondary: "bg-surface-1 text-secondary border border-subtle hover:bg-surface-2 focus:bg-surface-2",
  outline:
    "border border-accent-strong text-accent-primary bg-transparent hover:bg-accent-primary/10 focus:bg-accent-primary/20",
  ghost: "text-secondary hover:bg-surface-2 focus:bg-surface-2",
  destructive: "bg-danger-primary text-on-color hover:bg-danger-primary-hover focus:bg-danger-primary-selected",
};

const ToolbarSubmitButton = React.forwardRef(function ToolbarSubmitButton(
  { loading = false, variant = "primary", className, children, disabled, ...props }: ToolbarSubmitButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <div className="sticky right-1">
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-11 font-medium transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-accent-strong/20 focus:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          buttonVariants[variant],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
        {children}
      </button>
    </div>
  );
});

ToolbarRoot.displayName = "ToolbarRoot";
ToolbarGroup.displayName = "ToolbarGroup";
ToolbarItem.displayName = "ToolbarItem";
ToolbarSeparator.displayName = "ToolbarSeparator";
ToolbarSubmitButton.displayName = "ToolbarSubmitButton";

// compound components
const Toolbar = Object.assign(ToolbarRoot, {
  Group: ToolbarGroup,
  Item: ToolbarItem,
  Separator: ToolbarSeparator,
  SubmitButton: ToolbarSubmitButton,
});

export { Toolbar };
