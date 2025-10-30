import * as React from "react";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";
import { cn } from "../utils/classname";

export interface IToggleSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<IToggleSwitchProps> = ({ value, onChange, label, size = "sm", disabled, className }) => (
  <BaseSwitch.Root
    checked={value}
    disabled={disabled}
    onCheckedChange={onChange}
    aria-label={label}
    className={cn(
      "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border border-custom-border-200 transition-colors duration-200 ease-in-out focus:outline-none",
      // size
      size === "sm" ? "h-4 w-6" : size === "md" ? "h-5 w-8" : "h-6 w-10",
      // state
      disabled
        ? "cursor-not-allowed bg-custom-background-80"
        : value
          ? "cursor-pointer bg-custom-primary-100"
          : "cursor-pointer bg-custom-background-90",
      className
    )}
  >
    {label && <span className="sr-only">{label}</span>}
    <BaseSwitch.Thumb
      aria-hidden="true"
      className={cn(
        "inline-block self-center rounded-full shadow ring-0 transition-transform duration-200 ease-in-out",
        // size
        size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5",
        // position + color by state
        value
          ? size === "sm"
            ? "translate-x-3 bg-white"
            : size === "md"
              ? "translate-x-4 bg-white"
              : "translate-x-5 bg-white"
          : "translate-x-0.5 bg-custom-background-90",
        // disabled
        disabled && "cursor-not-allowed bg-custom-background-90"
      )}
    />
  </BaseSwitch.Root>
);

Switch.displayName = "plane-ui-switch";

export { Switch };
