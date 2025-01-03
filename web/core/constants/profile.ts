import React from "react";
// icons
import { Activity, Bell, CircleUser, KeyRound, LucideProps, Settings2, Blocks } from "lucide-react";
import { GithubIcon, SlackIcon } from "@plane/ui";
import { TPersonalAccountProvider } from "@/components/profile/connection/personal-account-view";

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
  {
    key: "connections",
    label: "Connections",
    href: `/profile/connections`,
    highlight: (pathname: string) => pathname === "/profile/connections/",
    Icon: Blocks,
  },
];

export const PROFILE_VIEWER_TAB = [
  {
    key: "summary",
    route: "",
    label: "Summary",
    selected: "/",
  },
];

export const PROFILE_ADMINS_TAB = [
  {
    key: "assigned",
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
    key: "subscribed",
    route: "subscribed",
    label: "Subscribed",
    selected: "/subscribed/",
  },
  {
    key: "activity",
    route: "activity",
    label: "Activity",
    selected: "/activity/",
  },
];

export type TUserConnection = "GITHUB" | "SLACK";

export const USER_CONNECTION_PROVIDERS: Record<TUserConnection, TPersonalAccountProvider> = {
  GITHUB: {
    key: "GITHUB",
    name: "GitHub",
    description: "Connect your GitHub account to Plane to get the most out of your development workflow.",
    icon: GithubIcon,
  },
  SLACK: {
    key: "SLACK",
    name: "Slack",
    description:
      "Connect your Slack account to Plane to get the most out of your team collaboration and communication.",
    icon: SlackIcon,
  },
} as const;
