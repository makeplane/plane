import { TUnreadNotificationsCount, TNotificationSettings } from "@plane/types";

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
    i18n_label: "notification.tabs.all",
    value: ENotificationTab.ALL,
    count: (unReadNotification: TUnreadNotificationsCount) =>
      unReadNotification?.total_unread_notifications_count || 0,
  },
  {
    i18n_label: "notification.tabs.mentions",
    value: ENotificationTab.MENTIONS,
    count: (unReadNotification: TUnreadNotificationsCount) =>
      unReadNotification?.mention_unread_notifications_count || 0,
  },
];

export const FILTER_TYPE_OPTIONS = [
  {
    i18n_label: "notification.filter.assigned",
    value: ENotificationFilterType.ASSIGNED,
  },
  {
    i18n_label: "notification.filter.created",
    value: ENotificationFilterType.CREATED,
  },
  {
    i18n_label: "notification.filter.subscribed",
    value: ENotificationFilterType.SUBSCRIBED,
  },
];

export const NOTIFICATION_SNOOZE_OPTIONS = [
  {
    key: "1_day",
    i18n_label: "notification.snooze.1_day",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "3_days",
    i18n_label: "notification.snooze.3_days",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "5_days",
    i18n_label: "notification.snooze.5_days",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "1_week",
    i18n_label: "notification.snooze.1_week",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "2_weeks",
    i18n_label: "notification.snooze.2_weeks",
    value: () => {
      const date = new Date();
      return new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);
    },
  },
  {
    key: "custom",
    i18n_label: "notification.snooze.custom",
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


export enum ENotificationSettingsKey {
  PROPERTY_CHANGE = "property_change",
  STATE_CHANGE = "state_change",
  PRIORITY = "priority",
  ASSIGNEE = "assignee",
  START_DUE_DATE = "start_due_date",
  COMMENTS = "comment",
  MENTIONED_COMMENTS = "mention",
  COMMENT_REACTIONS = "comment_reactions",
}

export enum EWorkspaceNotificationTransport {
  EMAIL = "EMAIL",
  IN_APP = "IN_APP",
}

export const TASK_UPDATES_NOTIFICATION_SETTINGS: TNotificationSettings[] = [
  {
    key: ENotificationSettingsKey.PROPERTY_CHANGE,
    i18n_title: "notification_settings.work_item_property_title",
    i18n_subtitle: "notification_settings.work_item_property_subtitle",
  },
  {
    key: ENotificationSettingsKey.STATE_CHANGE,
    i18n_title: "notification_settings.status_title",
    i18n_subtitle: "notification_settings.status_subtitle",
  },
  {
    key: ENotificationSettingsKey.PRIORITY,
    i18n_title: "notification_settings.priority_title",
    i18n_subtitle: "notification_settings.priority_subtitle",
  },
  {
    key: ENotificationSettingsKey.ASSIGNEE,
    i18n_title: "notification_settings.assignee_title",
    i18n_subtitle: "notification_settings.assignee_subtitle",
  },
  {
    key: ENotificationSettingsKey.START_DUE_DATE,
    i18n_title: "notification_settings.due_date_title",
    i18n_subtitle: "notification_settings.due_date_subtitle",
  }
]

export const COMMENT_NOTIFICATION_SETTINGS: TNotificationSettings[] = [
  {
    key: ENotificationSettingsKey.MENTIONED_COMMENTS,
    i18n_title: "notification_settings.mentioned_comments_title",
    i18n_subtitle: "notification_settings.mentioned_comments_subtitle",
  },
  {
    key: ENotificationSettingsKey.COMMENTS,
    i18n_title: "notification_settings.new_comments_title",
    i18n_subtitle: "notification_settings.new_comments_subtitle",
  },
  {
    key: ENotificationSettingsKey.COMMENT_REACTIONS,
    i18n_title: "notification_settings.reaction_comments_title",
    i18n_subtitle: "notification_settings.reaction_comments_subtitle",
  },
]

export const NOTIFICATION_SETTINGS: TNotificationSettings[] = [
 ...TASK_UPDATES_NOTIFICATION_SETTINGS,
 ...COMMENT_NOTIFICATION_SETTINGS 
]