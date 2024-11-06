import * as React from "react";
import { Switch } from "@headlessui/react";
// helpers
import { cn } from "../../helpers";

interface IToggleSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const ToggleSwitch: React.FC<IToggleSwitchProps> = (props) => {
  const { value, onChange, label, size = "sm", disabled, className } = props;

  return (
    <Switch
      checked={value}
      disabled={disabled}
      onChange={onChange}
      className={cn(
        "relative inline-flex flex-shrink-0 h-6 w-10 cursor-pointer rounded-full border border-custom-border-200 transition-colors duration-200 ease-in-out focus:outline-none bg-gray-700",
        {
          "h-4 w-6": size === "sm",
          "h-5 w-8": size === "md",
          "bg-custom-primary-100": value,
          "cursor-not-allowed bg-custom-background-80": disabled,
        },
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block self-center h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out",
          {
            "translate-x-5 bg-white": value,
            "h-2 w-2": size === "sm",
            "h-3 w-3": size === "md",
            "translate-x-3": value && size === "sm",
            "translate-x-4": value && size === "md",
            "translate-x-0.5 bg-custom-background-90": !value,
            "cursor-not-allowed bg-custom-background-90": disabled,
          }
        )}
      />
    </Switch>
  );
};

ToggleSwitch.displayName = "plane-ui-toggle-switch";

export { ToggleSwitch };
