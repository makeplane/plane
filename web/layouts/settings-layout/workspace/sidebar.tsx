import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

export enum EUserWorkspaceRoles {
  GUEST = 5,
  MEMBER = 15,
  ADMIN = 20,
}

export const WorkspaceSettingsSidebar = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { user: userStore }: RootStore = useMobxStore();

  const workspaceMemberInfo = userStore.currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const workspaceLinks: Array<{
    label: string;
    href: string;
    access: EUserWorkspaceRoles;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/settings`,
      access: EUserWorkspaceRoles.GUEST,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/settings/members`,
      access: EUserWorkspaceRoles.GUEST,
    },
    {
      label: "Billing & Plans",
      href: `/${workspaceSlug}/settings/billing`,
      access: EUserWorkspaceRoles.ADMIN,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/settings/integrations`,
      access: EUserWorkspaceRoles.ADMIN,
    },
    {
      label: "Imports",
      href: `/${workspaceSlug}/settings/imports`,
      access: EUserWorkspaceRoles.GUEST,
    },
    {
      label: "Exports",
      href: `/${workspaceSlug}/settings/exports`,
      access: EUserWorkspaceRoles.GUEST,
    },
    {
      label: "Webhooks",
      href: `/${workspaceSlug}/settings/webhooks`,
      access: EUserWorkspaceRoles.ADMIN,
    },
    {
      label: "API Tokens",
      href: `/${workspaceSlug}/settings/api-tokens`,
      access: EUserWorkspaceRoles.GUEST,
    },
  ];

  const profileLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "Profile",
      href: `/${workspaceSlug}/me/profile`,
    },
    {
      label: "Activity",
      href: `/${workspaceSlug}/me/profile/activity`,
    },
    {
      label: "Preferences",
      href: `/${workspaceSlug}/me/profile/preferences`,
    },
  ];

  function highlightSetting(label: string, link: string): boolean {
    if (router.asPath.startsWith(link) && (label === "Imports" || label === "Api tokens")) {
      return true;
    }
    return link === router.asPath;
  }

  return (
    <div className="flex flex-col gap-6 w-80 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-custom-sidebar-text-400 font-semibold">SETTINGS</span>
        <div className="flex flex-col gap-1 w-full">
          {workspaceLinks.map(
            (link) =>
              workspaceMemberInfo >= link.access && (
                <Link key={link.href} href={link.href}>
                  <a>
                    <div
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        router.pathname.split("/")?.[3] === link.href.split("/")?.[3]
                          ? "bg-custom-primary-100/10 text-custom-primary-100"
                          : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                      }`}
                    >
                      {link.label}
                    </div>
                  </a>
                </Link>
              )
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-custom-sidebar-text-400 font-semibold">My Account</span>
        <div className="flex flex-col gap-1 w-full">
          {profileLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a>
                <div
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    (link.label === "Import" ? router.asPath.includes(link.href) : router.asPath === link.href)
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
    </div>
  );
};
