// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";

type Props = {
  renderAs?: "input" | "button";
  value: Date | string | null | undefined;
  onChange: (val: string | null) => void;
  placeholder?: string;
  displayShortForm?: boolean;
  error?: boolean;
  className?: string;
  isClearable?: boolean;
  disabled?: boolean;
};

export const CustomDatePicker: React.FC<Props> = ({
  renderAs = "button",
  value,
  onChange,
  placeholder = "Select date",
  displayShortForm = false,
  error = false,
  className = "",
  isClearable = true,
  disabled = false,
}) => (
  <DatePicker
    placeholderText={placeholder}
    selected={value ? new Date(value) : null}
    onChange={(val) => {
      if (!val) onChange(null);
      else onChange(renderDateFormat(val));
    }}
    className={`${
      renderAs === "input"
        ? "block px-3 py-2 text-sm focus:outline-none"
        : renderAs === "button"
        ? `px-3 py-1 text-xs shadow-sm ${
            disabled ? "" : "hover:bg-brand-surface-1"
          } duration-300 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent`
        : ""
    } ${error ? "border-red-500 bg-red-100" : ""} ${
      disabled ? "cursor-not-allowed" : "cursor-pointer"
    } w-full rounded-md border border-brand-base bg-transparent caret-transparent ${className}`}
    dateFormat="dd-MM-yyyy"
    isClearable={isClearable}
    disabled={disabled}
  />
);
