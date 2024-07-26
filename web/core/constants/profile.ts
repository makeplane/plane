import React from "react";
// icons
import { Activity, Bell, CircleUser, KeyRound, LucideProps, Settings2 } from "lucide-react";

export const PROFILE_ACTION_LINKS: {
  key: string;
  label: string;
  href: string;
  highlight: (pathname: string) => boolean;
  Icon: React.FC<LucideProps>;
}[] = [
  {
    key: "profile",
    label: "Profile",
    href: `/profile`,
    highlight: (pathname: string) => pathname === "/profile/",
    Icon: CircleUser,
  },
  {
    key: "security",
    label: "Security",
    href: `/profile/security`,
    highlight: (pathname: string) => pathname === "/profile/security/",
    Icon: KeyRound,
  },
  {
    key: "activity",
    label: "Activity",
    href: `/profile/activity`,
    highlight: (pathname: string) => pathname === "/profile/activity/",
    Icon: Activity,
  },
  {
    key: "appearance",
    label: "Appearance",
    href: `/profile/appearance`,
    highlight: (pathname: string) => pathname.includes("/profile/appearance"),
    Icon: Settings2,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: `/profile/notifications`,
    highlight: (pathname: string) => pathname === "/profile/notifications/",
    Icon: Bell,
  },
];

export const PROFILE_VIEWER_TAB = [
  {
    route: "",
    label: "Summary",
    selected: "/",
  },
];

export const PROFILE_ADMINS_TAB = [
  {
    route: "assigned",
    label: "Assigned",
    selected: "/assigned/",
  },
  {
    route: "created",
    label: "Created",
    selected: "/created/",
  },
  {
    route: "subscribed",
    label: "Subscribed",
    selected: "/subscribed/",
  },
  {
    route: "activity",
    label: "Activity",
    selected: "/activity/",
  },
];
