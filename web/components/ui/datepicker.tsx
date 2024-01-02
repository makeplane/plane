// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";

type Props = {
  renderAs?: "input" | "button";
  value: Date | string | null | undefined;
  onChange: (val: string | null) => void;
  handleOnOpen?: () => void;
  handleOnClose?: () => void;
  customInput?: React.ReactNode;
  placeholder?: string;
  displayShortForm?: boolean;
  error?: boolean;
  noBorder?: boolean;
  wrapperClassName?: string;
  className?: string;
  isClearable?: boolean;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
};

export const CustomDatePicker: React.FC<Props> = ({
  renderAs = "button",
  value,
  onChange,
  handleOnOpen,
  handleOnClose,
  placeholder = "Select date",
  error = false,
  noBorder = false,
  wrapperClassName = "",
  className = "",
  isClearable = true,
  disabled = false,
  customInput,
  maxDate,
  minDate,
}) => (
  <DatePicker
    placeholderText={placeholder}
    selected={value ? new Date(value) : null}
    onChange={(val) => {
      if (!val) onChange(null);
      else onChange(renderFormattedPayloadDate(val));
    }}
    onCalendarOpen={handleOnOpen}
    onCalendarClose={handleOnClose}
    wrapperClassName={wrapperClassName}
    customInput={customInput}
    className={`${
      renderAs === "input"
        ? "block px-2 py-2 text-sm focus:outline-none"
        : renderAs === "button"
          ? `px-2 py-1 text-xs shadow-sm ${disabled ? "" : "hover:bg-custom-background-80"} duration-300`
          : ""
    } ${error ? "border-red-500 bg-red-100" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${
      noBorder ? "" : "border border-custom-border-200"
    } w-full rounded-md caret-transparent outline-none ${className}`}
    dateFormat="MMM dd, yyyy"
    isClearable={Boolean(isClearable && !disabled)}
    disabled={disabled}
    maxDate={maxDate}
    minDate={minDate}
  />
);
