// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  renderAs?: "input" | "button";
  value: Date | string | null | undefined;
  onChange: (arg: Date) => void;
  placeholder?: string;
  displayShortForm?: boolean;
  error?: boolean;
  className?: string;
  isClearable?: boolean;
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
}) => (
  <DatePicker
    placeholderText={placeholder}
    selected={value ? new Date(value) : null}
    onChange={onChange}
    dateFormat="dd-MM-yyyy"
    className={`${className} ${
      renderAs === "input"
        ? "block bg-transparent text-sm focus:outline-none rounded-md border border-gray-300 px-3 py-2 w-full cursor-pointer"
        : renderAs === "button"
        ? "w-full cursor-pointer rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        : ""
    } ${error ? "border-red-500 bg-red-200" : ""} bg-transparent caret-transparent`}
    isClearable={isClearable}
  />
);
