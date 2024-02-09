import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// hooks
import { useUser } from "hooks/store";
// constants
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_LINKS } from "constants/workspace";

export const WorkspaceSettingsSidebar = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  return (
    <div className="flex w-80 flex-col gap-6 px-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-sidebar-neutral-text-subtle">SETTINGS</span>
        <div className="flex w-full flex-col gap-1">
          {WORKSPACE_SETTINGS_LINKS.map(
            (link) =>
              workspaceMemberInfo >= link.access && (
                <Link key={link.key} href={`/${workspaceSlug}${link.href}`}>
                  <span>
                    <div
                      className={`rounded-md px-4 py-2 text-sm font-medium ${
                        link.highlight(router.asPath, `/${workspaceSlug}`)
                          ? "bg-primary-solid/10 text-primary-text-subtle"
                          : "text-sidebar-neutral-text-medium hover:bg-sidebar-neutral-component-surface-dark focus:bg-sidebar-neutral-component-surface-dark"
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
