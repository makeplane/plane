// [FA-CUSTOM] Shamsi (Jalali) date picker wrapper using react-multi-date-picker
import React, { useCallback, useMemo } from "react";
import { Calendar as RMDPCalendar, DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Matcher } from "@plane/propel/calendar";

type ShamsiCalendarProps = {
  className?: string;
  selected?: Date;
  defaultMonth?: Date;
  onSelect?: (date: Date | undefined) => void;
  showOutsideDays?: boolean;
  disabled?: Matcher[];
  mode?: "single" | "range";
  weekStartsOn?: number;
  // Range mode props
  selectedRange?: { from: Date | undefined; to: Date | undefined };
  onRangeSelect?: (range: { from: Date | undefined; to: Date | undefined }) => void;
};

/**
 * Shamsi calendar wrapper around react-multi-date-picker.
 * Designed to be a drop-in replacement for the Gregorian Calendar component
 * in DateDropdown and DateRangeDropdown.
 */
export const ShamsiCalendar: React.FC<ShamsiCalendarProps> = ({
  className,
  selected,
  defaultMonth,
  onSelect,
  disabled = [],
  mode = "single",
  weekStartsOn,
  selectedRange,
  onRangeSelect,
}) => {
  // Convert Matcher[] to minDate/maxDate for react-multi-date-picker
  const { minDate, maxDate } = useMemo(() => {
    let min: Date | undefined;
    let max: Date | undefined;
    for (const matcher of disabled) {
      if (matcher && typeof matcher === "object" && "before" in matcher) {
        min = matcher.before;
      }
      if (matcher && typeof matcher === "object" && "after" in matcher) {
        max = matcher.after;
      }
    }
    return { minDate: min, maxDate: max };
  }, [disabled]);

  // Single date change handler
  const handleSingleChange = useCallback(
    (dateObj: DateObject | DateObject[] | null) => {
      if (!onSelect) return;
      if (!dateObj) {
        onSelect(undefined);
        return;
      }
      const single = Array.isArray(dateObj) ? dateObj[0] : dateObj;
      if (!single) {
        onSelect(undefined);
        return;
      }
      onSelect(single.toDate());
    },
    [onSelect]
  );

  // Range date change handler
  const handleRangeChange = useCallback(
    (dateObj: DateObject | DateObject[] | null) => {
      if (!onRangeSelect) return;
      if (!dateObj || !Array.isArray(dateObj)) {
        onRangeSelect({ from: undefined, to: undefined });
        return;
      }
      const from = dateObj[0]?.toDate();
      const to = dateObj[1]?.toDate();
      onRangeSelect({ from, to });
    },
    [onRangeSelect]
  );

  // Helper: create DateObject with Persian calendar from a JS Date
  const toPersianDateObj = useCallback(
    (d: Date) => new DateObject({ date: d, calendar: persian, locale: persian_fa }),
    []
  );

  // Determine initial value
  const value = useMemo(() => {
    if (mode === "range" && selectedRange) {
      const vals: DateObject[] = [];
      if (selectedRange.from) vals.push(toPersianDateObj(selectedRange.from));
      if (selectedRange.to) vals.push(toPersianDateObj(selectedRange.to));
      return vals.length > 0 ? vals : undefined;
    }
    return selected ? toPersianDateObj(selected) : undefined;
  }, [mode, selected, selectedRange, toPersianDateObj]);

  // Default month for initial view
  const currentDate = useMemo(() => {
    if (mode === "range" && selectedRange?.from) return toPersianDateObj(selectedRange.from);
    if (defaultMonth) return toPersianDateObj(defaultMonth);
    if (selected) return toPersianDateObj(selected);
    return new DateObject({ calendar: persian, locale: persian_fa });
  }, [mode, defaultMonth, selected, selectedRange, toPersianDateObj]);

  return (
    <div className={className}>
      <RMDPCalendar
        value={value}
        onChange={mode === "range" ? handleRangeChange : handleSingleChange}
        calendar={persian}
        locale={persian_fa}
        currentDate={currentDate}
        minDate={minDate ? toPersianDateObj(minDate) : undefined}
        maxDate={maxDate ? toPersianDateObj(maxDate) : undefined}
        range={mode === "range"}
        weekStartDayIndex={weekStartsOn ?? 6} // Saturday default for Jalali
        className="fa-shamsi-calendar"
        headerOrder={["MONTH_YEAR", "LEFT_BUTTON", "RIGHT_BUTTON"]}
        monthYearSeparator=" "
        shadow={false}
      />
    </div>
  );
};

export default ShamsiCalendar;
