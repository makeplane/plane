import useSWR from "swr";
import { TTimezoneObject } from "@plane/types";
// services
import timezoneService from "@/services/timezone.service";

// group timezones by value
const groupTimezones = (timezones: TTimezoneObject[]): TTimezoneObject[] => {
  const groupedMap = timezones.reduce((acc, timezone: TTimezoneObject) => {
    const key = timezone.value;

    if (!acc.has(key)) {
      acc.set(key, {
        utc_offset: timezone.utc_offset,
        gmt_offset: timezone.gmt_offset,
        value: timezone.value,
        label: timezone.label,
      });
    } else {
      const existing = acc.get(key);
      existing.label = `${existing.label}, ${timezone.label}`;
    }

    return acc;
  }, new Map());

  return Array.from(groupedMap.values());
};

const useTimezone = () => {
  // fetching the timezone from the server
  const {
    data: timezones,
    isLoading: timezoneIsLoading,
    error: timezonesError,
  } = useSWR("TIMEZONES_LIST", () => timezoneService.fetch(), {
    refreshInterval: 0,
  });

  // derived values
  const isDisabled = timezoneIsLoading || timezonesError || !timezones;

  const getTimeZoneLabel = (timezone: TTimezoneObject | undefined) => {
    if (!timezone) return undefined;
    return (
      <div className="flex gap-1.5">
        <span className="text-custom-text-400">{timezone.utc_offset}</span>
        <span className="text-custom-text-200">{timezone.label}</span>
      </div>
    );
  };
  const options = [
    ...groupTimezones(timezones?.timezones || [])?.map((timezone) => ({
      value: timezone.value,
      query: `${timezone.value} ${timezone.label}, ${timezone.gmt_offset}, ${timezone.utc_offset}`,
      content: getTimeZoneLabel(timezone),
    })),
    {
      value: "UTC",
      query: "utc, coordinated universal time",
      content: "UTC",
    },
    {
      value: "Universal",
      query: "universal, coordinated universal time",
      content: "Universal",
    },
  ];

  const selectedTimezone = (value: string | undefined) => options.find((option) => option.value === value)?.content;

  return {
    timezones: options,
    isLoading: timezoneIsLoading,
    error: timezonesError,
    disabled: isDisabled,
    selectedValue: selectedTimezone,
  };
};

export default useTimezone;
