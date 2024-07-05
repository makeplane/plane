export enum ENotificationTab {
  ALL = "all",
  MENTIONS = "mentions",
}

export enum ENotificationFilterType {
  CREATED = "created",
  ASSIGNED = "assigned",
  SUBSCRIBED = "subscribed",
}

export enum ENotificationLoader {
  INIT_LOADER = "init-loader",
  MUTATION_LOADER = "mutation-loader",
  PAGINATION_LOADER = "pagination-loader",
  REFRESH = "refresh",
  MARK_ALL_AS_READY = "mark-all-as-read",
}

export enum ENotificationQueryParamType {
  INIT = "init",
  CURRENT = "current",
  NEXT = "next",
}

export type TNotificationTab = ENotificationTab.ALL | ENotificationTab.MENTIONS;

export const NOTIFICATION_TABS = [
  {
    label: "All",
    value: ENotificationTab.ALL,
  },
  // {
  //   label: "Mentions",
  //   value: ENotificationTab.MENTIONS,
  // },
];

export const FILTER_TYPE_OPTIONS = [
  {
    label: "Assigned to me",
    value: ENotificationFilterType.ASSIGNED,
  },
  {
    label: "Created by me",
    value: ENotificationFilterType.CREATED,
  },
  {
    label: "Subscribed by me",
    value: ENotificationFilterType.SUBSCRIBED,
  },
];

export const NOTIFICATION_SNOOZE_OPTIONS = [
  {
    key: "1_day",
    label: "1 day",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "3_days",
    label: "3 days",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "5_days",
    label: "5 days",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "1_week",
    label: "1 week",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "2_weeks",
    label: "2 weeks",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "custom",
    label: "Custom",
    value: undefined,
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
