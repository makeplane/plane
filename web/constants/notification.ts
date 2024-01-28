export const snoozeOptions = [
  {
    label: "1 day",
    value: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
  },
  {
    label: "3 days",
    value: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    label: "5 days",
    value: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    label: "1 week",
    value: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    label: "2 weeks",
    value: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    label: "Custom",
    value: null,
  },
];

// Constant for all time values in 30 minutes interval in 12 hours format
export const allTimeIn30MinutesInterval12HoursFormat: Array<{
  label: string;
  value: string;
}> = [
  { label: "12:00", value: "12:00" },
  { label: "12:30", value: "12:30" },
  { label: "01:00", value: "01:00" },
  { label: "01:30", value: "01:30" },
  { label: "02:00", value: "02:00" },
  { label: "02:30", value: "02:30" },
  { label: "03:00", value: "03:00" },
  { label: "03:30", value: "03:30" },
  { label: "04:00", value: "04:00" },
  { label: "04:30", value: "04:30" },
  { label: "05:00", value: "05:00" },
  { label: "05:30", value: "05:30" },
  { label: "06:00", value: "06:00" },
  { label: "06:30", value: "06:30" },
  { label: "07:00", value: "07:00" },
  { label: "07:30", value: "07:30" },
  { label: "08:00", value: "08:00" },
  { label: "08:30", value: "08:30" },
  { label: "09:00", value: "09:00" },
  { label: "09:30", value: "09:30" },
  { label: "10:00", value: "10:00" },
  { label: "10:30", value: "10:30" },
  { label: "11:00", value: "11:00" },
  { label: "11:30", value: "11:30" },
];
