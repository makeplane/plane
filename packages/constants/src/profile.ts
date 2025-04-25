export const PROFILE_SETTINGS = {
  profile: {
    key: "profile",
    i18n_label: "profile.actions.profile",
    href: `/settings/account`,
    highlight: (pathname: string) => pathname === "/settings/account/",
  },
  security: {
    key: "security",
    i18n_label: "profile.actions.security",
    href: `/settings/account/security`,
    highlight: (pathname: string) => pathname === "/settings/account/security/",
  },
  activity: {
    key: "activity",
    i18n_label: "profile.actions.activity",
    href: `/settings/account/activity`,
    highlight: (pathname: string) => pathname === "/settings/account/activity/",
  },
  appearance: {
    key: "appearance",
    i18n_label: "profile.actions.appearance",
    href: `/settings/account/appearance`,
    highlight: (pathname: string) => pathname.includes("/settings/account/appearance"),
  },
  notifications: {
    key: "notifications",
    i18n_label: "profile.actions.notifications",
    href: `/settings/account/notifications`,
    highlight: (pathname: string) => pathname === "/settings/account/notifications/",
  },
  "api-tokens": {
    key: "api-tokens",
    i18n_label: "profile.actions.api-tokens",
    href: `/settings/account/api-tokens`,
    highlight: (pathname: string) => pathname === "/settings/account/api-tokens/",
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
