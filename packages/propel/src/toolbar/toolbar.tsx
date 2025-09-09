import * as React from "react";
import { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
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

const ToolbarRoot = React.forwardRef<HTMLDivElement, ToolbarProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-9 w-full items-stretch gap-1.5 bg-custom-background-90 overflow-x-scroll", className)}
    {...props}
  >
    {children}
  </div>
));

const ToolbarGroup = React.forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, children, isFirst = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-stretch gap-0.5 border-r border-custom-border-200 px-2.5",
        {
          "pl-0": isFirst,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

const ToolbarItem = React.forwardRef<HTMLButtonElement, ToolbarItemProps>(
  ({ icon: Icon, isActive = false, tooltip, shortcut, className, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type="button"
        className={cn(
          "grid place-items-center aspect-square rounded-sm p-0.5 text-custom-text-400 hover:bg-custom-background-80 transition-colors",
          {
            "bg-custom-background-80 text-custom-text-100": isActive,
          },
          className
        )}
        {...props}
      >
        <Icon
          className={cn("h-3.5 w-3.5", {
            "text-custom-text-100": isActive,
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
            <div className="flex flex-col gap-1 text-center text-xs">
              <span className="font-medium">{tooltip}</span>
              {shortcut && <kbd className="text-custom-text-400">{shortcut.join(" + ")}</kbd>}
            </div>
          }
        >
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);

const ToolbarSeparator = React.forwardRef<HTMLDivElement, ToolbarSeparatorProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("h-full w-px bg-custom-border-200 mx-1", className)} {...props} />
));

const buttonVariants = {
  primary: "bg-custom-primary-100 text-white hover:bg-custom-primary-200 focus:bg-custom-primary-200",
  secondary:
    "bg-custom-background-100 text-custom-text-200 border border-custom-border-200 hover:bg-custom-background-90 focus:bg-custom-background-90",
  outline:
    "border border-custom-primary-100 text-custom-primary-100 bg-transparent hover:bg-custom-primary-100/10 focus:bg-custom-primary-100/20",
  ghost: "text-custom-text-200 hover:bg-custom-background-90 focus:bg-custom-background-90",
  destructive: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600",
};

const ToolbarSubmitButton = React.forwardRef<HTMLButtonElement, ToolbarSubmitButtonProps>(
  ({ loading = false, variant = "primary", className, children, disabled, ...props }, ref) => (
    <div className="sticky right-1">
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-custom-primary-100/20 focus:ring-offset-2",
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
  )
);

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
