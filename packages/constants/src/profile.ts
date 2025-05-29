import { EXTENDED_PROFILE_ACTION_LINKS } from "./profile-extended";

type TProfileActionLink = {
  key: string;
  i18n_label: string;
  href: string;
  highlight: (pathname: string) => boolean;
};

export const PROFILE_ACTION_LINKS: TProfileActionLink[] = [
  {
    key: "profile",
    i18n_label: "profile.actions.profile",
    href: `/profile`,
    highlight: (pathname: string) => pathname === "/profile/",
  },
  {
    key: "security",
    i18n_label: "profile.actions.security",
    href: `/profile/security`,
    highlight: (pathname: string) => pathname === "/profile/security/",
  },
  {
    key: "activity",
    i18n_label: "profile.actions.activity",
    href: `/profile/activity`,
    highlight: (pathname: string) => pathname === "/profile/activity/",
  },
  {
    key: "appearance",
    i18n_label: "profile.actions.appearance",
    href: `/profile/appearance`,
    highlight: (pathname: string) => pathname.includes("/profile/appearance"),
  },
  {
    key: "notifications",
    i18n_label: "profile.actions.notifications",
    href: `/profile/notifications`,
    highlight: (pathname: string) => pathname === "/profile/notifications/",
  },
  ...EXTENDED_PROFILE_ACTION_LINKS,
];

export const PROFILE_VIEWER_TAB = [
  {
    key: "summary",
    route: "",
    i18n_label: "profile.tabs.summary",
    selected: "/",
  },
];

export const PROFILE_ADMINS_TAB = [
  {
    key: "assigned",
    route: "assigned",
    i18n_label: "profile.tabs.assigned",
    selected: "/assigned/",
  },
  {
    key: "created",
    route: "created",
    i18n_label: "profile.tabs.created",
    selected: "/created/",
  },
  {
    key: "subscribed",
    route: "subscribed",
    i18n_label: "profile.tabs.subscribed",
    selected: "/subscribed/",
  },
  {
    key: "activity",
    route: "activity",
    i18n_label: "profile.tabs.activity",
    selected: "/activity/",
  },
];

/**
 * @description The start of the week for the user
 * @enum {number}
 */
export enum EStartOfTheWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * @description The options for the start of the week
 * @type {Array<{value: EStartOfTheWeek, label: string}>}
 * @constant
 */
export const START_OF_THE_WEEK_OPTIONS = [
  {
    value: EStartOfTheWeek.SUNDAY,
    label: "Sunday",
  },
  {
    value: EStartOfTheWeek.MONDAY,
    label: "Monday",
  },
  {
    value: EStartOfTheWeek.TUESDAY,
    label: "Tuesday",
  },
  {
    value: EStartOfTheWeek.WEDNESDAY,
    label: "Wednesday",
  },
  {
    value: EStartOfTheWeek.THURSDAY,
    label: "Thursday",
  },
  {
    value: EStartOfTheWeek.FRIDAY,
    label: "Friday",
  },
  {
    value: EStartOfTheWeek.SATURDAY,
    label: "Saturday",
  },
];
