// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";

type Props = {
  renderAs?: "input" | "button";
  value: Date | string | null | undefined;
  onChange: (val: string | null) => void;
  error?: boolean;
  className?: string;
  isClearable?: boolean;
  disabled?: boolean;
  startDate: string | null;
  endDate: string | null;
  selectsStart?: boolean;
  selectsEnd?: boolean;
  minDate?: Date | null | undefined;
  maxDate?: Date | null | undefined;
};

export const CustomRangeDatePicker: React.FC<Props> = ({
  renderAs = "button",
  value,
  onChange,
  error = false,
  className = "",
  disabled = false,
  startDate,
  endDate,
  selectsStart = false,
  selectsEnd = false,
  minDate = null,
  maxDate = null,
}) => (
  <DatePicker
    selected={value ? new Date(value) : null}
    onChange={(val) => {
      if (!val) onChange(null);
      else onChange(renderFormattedPayloadDate(val));
    }}
    className={`${
      renderAs === "input"
        ? "block px-3 py-2 text-sm focus:outline-none"
        : renderAs === "button"
          ? `px-3 py-1 text-xs shadow-sm ${
              disabled ? "" : "hover:bg-custom-background-80"
            } duration-300 focus:border-custom-primary focus:outline-none focus:ring-1 focus:ring-custom-primary`
          : ""
    } ${error ? "border-red-500 bg-red-100" : ""} ${
      disabled ? "cursor-not-allowed" : "cursor-pointer"
    } w-full rounded-md border border-custom-border-200 bg-transparent caret-transparent ${className}`}
    dateFormat="dd-MM-yyyy"
    disabled={disabled}
    selectsStart={selectsStart}
    selectsEnd={selectsEnd}
    startDate={startDate ? new Date(startDate) : new Date()}
    endDate={endDate ? new Date(endDate) : new Date()}
    minDate={minDate}
    maxDate={maxDate}
    shouldCloseOnSelect
    inline
  />
);
