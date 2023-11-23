import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const PROFILE_LINKS: Array<{
  label: string;
  href: string;
}> = [
  {
    label: "Profile",
    href: `/me/profile`,
  },
  {
    label: "Activity",
    href: `/me/profile/activity`,
  },
  {
    label: "Preferences",
    href: `/me/profile/preferences`,
  },
];

export const ProfileSettingsSidebar = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2 w-80 px-5">
      <span className="text-xs text-custom-sidebar-text-400 font-semibold">My Account</span>
      <div className="flex flex-col gap-1 w-full">
        {PROFILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <a>
              <div
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  router.asPath === link.href
                    ? "bg-custom-primary-100/10 text-custom-primary-100"
                    : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                }`}
              >
                {link.label}
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};
