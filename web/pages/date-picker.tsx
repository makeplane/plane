import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import addDays from "date-fns/addDays";

const pastMonth = new Date(2020, 10, 15);

const DatePickerPage = () => {
  const defaultSelected: DateRange = {
    from: pastMonth,
    to: addDays(pastMonth, 4),
  };
  const [range, setRange] = useState<DateRange | undefined>(defaultSelected);

  return (
    <div>
      <DayPicker selected={range} onSelect={setRange} mode="range" />
    </div>
  );
};

export default DatePickerPage;
