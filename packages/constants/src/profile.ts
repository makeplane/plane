export const PROFILE_ACTION_LINKS: {
  key: string;
  i18n_label: string;
  href: string;
  highlight: (pathname: string) => boolean;
}[] = [
  {
    key: "profile",
    i18n_label: "user_profile.actions.profile",
    href: `/profile`,
    highlight: (pathname: string) => pathname === "/profile/",
  },
  {
    key: "security",
    i18n_label: "user_profile.actions.security",
    href: `/profile/security`,
    highlight: (pathname: string) => pathname === "/profile/security/",
  },
  {
    key: "activity",
    i18n_label: "user_profile.actions.activity",
    href: `/profile/activity`,
    highlight: (pathname: string) => pathname === "/profile/activity/",
  },
  {
    key: "appearance",
    i18n_label: "user_profile.actions.appearance",
    href: `/profile/appearance`,
    highlight: (pathname: string) => pathname.includes("/profile/appearance"),
  },
  {
    key: "notifications",
    i18n_label: "user_profile.actions.notifications",
    href: `/profile/notifications`,
    highlight: (pathname: string) => pathname === "/profile/notifications/",
  },
];

export const PROFILE_VIEWER_TAB = [
  {
    key: "summary",
    route: "",
    i18n_label: "user_profile.tabs.summary",
    selected: "/",
  },
];

export const PROFILE_ADMINS_TAB = [
  {
    key: "assigned",
    route: "assigned",
    i18n_label: "user_profile.tabs.assigned",
    selected: "/assigned/",
  },
  {
    key: "created",
    route: "created",
    i18n_label: "user_profile.tabs.created",
    selected: "/created/",
  },
  {
    key: "subscribed",
    route: "subscribed",
    i18n_label: "user_profile.tabs.subscribed",
    selected: "/subscribed/",
  },
  {
    key: "activity",
    route: "activity",
    i18n_label: "user_profile.tabs.activity",
    selected: "/activity/",
  },
];
