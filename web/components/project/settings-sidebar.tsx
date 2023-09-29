import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const SettingsSidebar = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const projectLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: store.locale.localized("General"),
      href: `/${workspaceSlug}/projects/${projectId}/settings`,
    },
    {
      label: store.locale.localized("Members"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
    },
    {
      label: store.locale.localized("Features"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
    },
    {
      label: store.locale.localized("States"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
    },
    {
      label: store.locale.localized("Labels"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
    },
    {
      label: store.locale.localized("Integrations"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/integrations`,
    },
    {
      label: store.locale.localized("Estimates"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/estimates`,
    },
    {
      label: store.locale.localized("Automations"),
      href: `/${workspaceSlug}/projects/${projectId}/settings/automations`,
    },
  ];

  const workspaceLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: store.locale.localized("General"),
      href: `/${workspaceSlug}/settings`,
    },
    {
      label: store.locale.localized("Members"),
      href: `/${workspaceSlug}/settings/members`,
    },
    {
      label: store.locale.localized("Billing & Plans"),
      href: `/${workspaceSlug}/settings/billing`,
    },
    {
      label: store.locale.localized("Integrations"),
      href: `/${workspaceSlug}/settings/integrations`,
    },
    {
      label: store.locale.localized("Imports"),
      href: `/${workspaceSlug}/settings/imports`,
    },
    {
      label: store.locale.localized("Exports"),
      href: `/${workspaceSlug}/settings/exports`,
    },
  ];

  const profileLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: store.locale.localized("Profile"),
      href: `/${workspaceSlug}/me/profile`,
    },
    {
      label: store.locale.localized("Activity"),
      href: `/${workspaceSlug}/me/profile/activity`,
    },
    {
      label: store.locale.localized("Preferences"),
      href: `/${workspaceSlug}/me/profile/preferences`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-80 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-custom-sidebar-text-400 font-semibold">
          {store.locale.localized("Settings")}
        </span>
        <div className="flex flex-col gap-1 w-full">
          {(projectId ? projectLinks : workspaceLinks).map((link) => (
            <Link key={link.href} href={link.href}>
              <a>
                <div
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    (
                      link.label === "Import"
                        ? router.asPath.includes(link.href)
                        : router.asPath === link.href
                    )
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
      {!projectId && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-custom-sidebar-text-400 font-semibold">
            {store.locale.localized("My Account")}
          </span>
          <div className="flex flex-col gap-1 w-full">
            {profileLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a>
                  <div
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      (
                        link.label === "Import"
                          ? router.asPath.includes(link.href)
                          : router.asPath === link.href
                      )
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
      )}
    </div>
  );
};
