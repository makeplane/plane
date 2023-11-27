import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";

const PROFILE_LINKS: Array<{
  key: string;
  label: string;
  href: string;
}> = [
  {
    key: "profile",
    label: "Profile",
    href: `/profile`,
  },
  {
    key: "change-password",
    label: "Change password",
    href: `/profile/change-password`,
  },
  {
    key: "activity",
    label: "Activity",
    href: `/profile/activity`,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: `/profile/preferences`,
  },
];

export const ProfileSettingsSidebar = observer(() => {
  const router = useRouter();
  const {
    appConfig: { envConfig },
  } = useMobxStore();
  const enableEmailPassword =
    envConfig &&
    (envConfig?.email_password_login ||
      !(
        envConfig?.email_password_login ||
        envConfig?.magic_login ||
        envConfig?.google_client_id ||
        envConfig?.github_client_id
      ));

  return (
    <div className="flex flex-col gap-2 w-80 px-5">
      <span className="text-xs text-custom-sidebar-text-400 font-semibold">My Account</span>
      <div className="flex flex-col gap-1 w-full">
        {PROFILE_LINKS.map((link) => {
          if (link.key === "change-password" && !enableEmailPassword) return;
          return (
            <Link key={link.key} href={link.href}>
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
          );
        })}
      </div>
    </div>
  );
});
