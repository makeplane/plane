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
