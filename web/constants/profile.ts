import React from "react";
// icons
import { Activity, CircleUser, KeyRound, LucideProps, Settings2 } from "lucide-react";

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
    highlight: (pathname: string) => pathname === "/profile",
    Icon: CircleUser,
  },
  {
    key: "change-password",
    label: "Change password",
    href: `/profile/change-password`,
    highlight: (pathname: string) => pathname === "/profile/change-password",
    Icon: KeyRound,
  },
  {
    key: "activity",
    label: "Activity",
    href: `/profile/activity`,
    highlight: (pathname: string) => pathname === "/profile/activity",
    Icon: Activity,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: `/profile/preferences/theme`,
    highlight: (pathname: string) => pathname.includes("/profile/preferences"),
    Icon: Settings2,
  },
];
