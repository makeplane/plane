import { Switch } from "@headlessui/react";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export const ToggleSwitch: React.FC<Props> = (props) => {
  const { value, onChange, label, disabled, className } = props;

  return (
    <Switch
      checked={value}
      disabled={disabled}
      onChange={onChange}
      className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        value ? "bg-green-500" : "bg-gray-200"
      } ${className || " "}`}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? "translate-x-2.5" : "translate-x-0"
        }`}
      />
    </Switch>
  );
};
