// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
      else {
        const year = val.getFullYear();
        let month: number | string = val.getMonth() + 1;
        let date: number | string = val.getDate();

        if (date < 10) date = `0${date}`;
        if (month < 10) month = `0${month}`;

        onChange(`${year}-${month}-${date}`);
      }
    }}
    className={`${className} ${
      renderAs === "input"
        ? "block bg-transparent text-sm focus:outline-none border-gray-300 px-3 py-2"
        : renderAs === "button"
        ? `px-2 py-1 text-xs shadow-sm ${
            disabled ? "" : "hover:bg-gray-100"
          } focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 duration-300`
        : ""
    } ${error ? "border-red-500 bg-red-100" : ""} ${
      disabled ? "cursor-not-allowed" : "cursor-pointer"
    } w-full rounded-md bg-transparent border caret-transparent`}
    dateFormat="dd-MM-yyyy"
    isClearable={isClearable}
    disabled={disabled}
  />
);
