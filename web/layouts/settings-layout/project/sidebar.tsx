import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export const ProjectSettingsSidebar = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const projectLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/projects/${projectId}/settings`,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
    },
    {
      label: "Features",
      href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
    },
    {
      label: "States",
      href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
    },
    {
      label: "Labels",
      href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/projects/${projectId}/settings/integrations`,
    },
    {
      label: "Estimates",
      href: `/${workspaceSlug}/projects/${projectId}/settings/estimates`,
    },
    {
      label: "Automations",
      href: `/${workspaceSlug}/projects/${projectId}/settings/automations`,
    },
  ];
  return (
    <div className="flex w-80 flex-col gap-6 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-custom-sidebar-text-400">SETTINGS</span>
        <div className="flex w-full flex-col gap-1">
          {projectLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  (link.label === "Import" ? router.asPath.includes(link.href) : router.asPath === link.href)
                    ? "bg-custom-primary-100/10 text-custom-primary-100"
                    : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                }`}
              >
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
