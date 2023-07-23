import { Switch } from "@headlessui/react";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
};

export const ToggleSwitch: React.FC<Props> = (props) => {
  const { value, onChange, label, size = "sm", disabled, className } = props;

  return (
    <Switch
      checked={value}
      disabled={disabled}
      onChange={onChange}
      className={`relative flex-shrink-0 inline-flex ${
        size === "sm" ? "h-3.5 w-6" : size === "md" ? "h-4 w-7" : "h-6 w-11"
      } flex-shrink-0 cursor-pointer rounded-full border-2 border-custom-border-200 transition-colors duration-200 ease-in-out focus:outline-none ${
        value ? "bg-green-500" : "bg-custom-background-80"
      } ${className || ""}`}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`inline-block ${
          size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-5 w-5"
        } transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
          value
            ? (size === "sm"
                ? "translate-x-2.5"
                : size === "md"
                ? "translate-x-3"
                : "translate-x-5") + " bg-white"
            : "translate-x-0 bg-custom-background-90"
        }`}
      />
    </Switch>
  );
};
