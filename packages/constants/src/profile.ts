export const PROFILE_SETTINGS = {
  profile: {
    key: "profile",
    i18n_label: "profile.actions.profile",
    href: `/settings/profile`,
    highlight: (pathname: string) => pathname === "/settings/profile/",
  },
  security: {
    key: "security",
    i18n_label: "profile.actions.security",
    href: `/settings/profile/security`,
    highlight: (pathname: string) => pathname === "/settings/profile/security/",
  },
  activity: {
    key: "activity",
    i18n_label: "profile.actions.activity",
    href: `/settings/profile/activity`,
    highlight: (pathname: string) => pathname === "/settings/profile/activity/",
  },
  appearance: {
    key: "appearance",
    i18n_label: "profile.actions.appearance",
    href: `/settings/profile/appearance`,
    highlight: (pathname: string) => pathname.includes("/settings/profile/appearance"),
  },
  notifications: {
    key: "notifications",
    i18n_label: "profile.actions.notifications",
    href: `/settings/profile/notifications`,
    highlight: (pathname: string) => pathname === "/settings/profile/notifications/",
  },
  "api-tokens": {
    key: "api-tokens",
    i18n_label: "profile.actions.api-tokens",
    href: `/settings/profile/api-tokens`,
    highlight: (pathname: string) => pathname === "/settings/profile/api-tokens/",
  },
};
export const PROFILE_ACTION_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  highlight: (pathname: string) => boolean;
}[] = [
  PROFILE_SETTINGS["profile"],
  PROFILE_SETTINGS["security"],
  PROFILE_SETTINGS["activity"],
  PROFILE_SETTINGS["appearance"],
  PROFILE_SETTINGS["notifications"],
  PROFILE_SETTINGS["api-tokens"],
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
