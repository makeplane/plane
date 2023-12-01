import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_LINKS } from "constants/workspace";

export const WorkspaceSettingsSidebar = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  return (
    <div className="flex flex-col gap-6 w-80 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-custom-sidebar-text-400 font-semibold">SETTINGS</span>
        <div className="flex flex-col gap-1 w-full">
          {WORKSPACE_SETTINGS_LINKS.map(
            (link) =>
              workspaceMemberInfo >= link.access && (
                <Link key={link.href} href={`/${workspaceSlug}/${link.href}`}>
                  <span>
                    <div
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        router.pathname.split("/")?.[3] === link.href.split("/")?.[2]
                          ? "bg-custom-primary-100/10 text-custom-primary-100"
                          : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                      }`}
                    >
                      {link.label}
                    </div>
                  </span>
                </Link>
              )
          )}
        </div>
      </div>
    </div>
  );
};
