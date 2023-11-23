import { FC, ReactNode } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Tooltip } from "@plane/ui";
import { Plus, UserPlus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layout
import { UserAuthWrapper } from "layouts/auth-layout";
// components
import { ProfileSettingsSidebar } from "layouts/settings-layout";
import { CommandPalette } from "components/command-palette";

interface IProfileSettingsLayout {
  children: ReactNode;
  header: ReactNode;
}

const SIDEBAR_LINKS = [
  {
    key: "create-workspace",
    Icon: Plus,
    name: "Create workspace",
    href: "/create-workspace",
  },
  {
    key: "invitations",
    Icon: UserPlus,
    name: "Invitations",
    href: "/invitations",
  },
];

export const ProfileSettingsLayout: FC<IProfileSettingsLayout> = observer((props) => {
  const { children, header } = props;

  const {
    theme: { sidebarCollapsed },
    workspace: { workspaces },
  } = useMobxStore();

  return (
    <>
      <CommandPalette />
      <UserAuthWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <div
            className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
              sidebarCollapsed ? "" : "md:w-[280px]"
            } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
          >
            <div className="h-full w-full flex flex-col">
              <div className="w-full cursor-pointer space-y-1 p-4">
                {SIDEBAR_LINKS.map((link) => (
                  <Link key={link.key} href={link.href}>
                    <a className="block w-full">
                      <Tooltip
                        tooltipContent={link.name}
                        position="right"
                        className="ml-2"
                        disabled={!sidebarCollapsed}
                      >
                        <div
                          className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80 ${
                            sidebarCollapsed ? "justify-center" : ""
                          }`}
                        >
                          {<link.Icon className="h-4 w-4" />}
                          {!sidebarCollapsed && link.name}
                        </div>
                      </Tooltip>
                    </a>
                  </Link>
                ))}
              </div>
              {workspaces && workspaces.length > 0 && (
                <div className="flex flex-col px-4">
                  {!sidebarCollapsed && (
                    <div className="rounded text-custom-sidebar-text-400 px-1.5 text-sm font-semibold">
                      Your workspaces
                    </div>
                  )}
                  <div className="space-y-2 mt-2">
                    {workspaces.map((workspace) => (
                      <Link
                        key={workspace.id}
                        href={`/${workspace.slug}`}
                        className={`flex items-center flex-grow truncate cursor-pointer select-none text-left text-sm font-medium ${
                          sidebarCollapsed ? "justify-center" : `justify-between`
                        }`}
                      >
                        <a
                          className={`flex items-center flex-grow w-full truncate gap-x-2 px-2 py-1 hover:bg-custom-sidebar-background-80 rounded-md ${
                            sidebarCollapsed ? "justify-center" : ""
                          }`}
                        >
                          <span
                            className={`relative flex h-6 w-6 items-center justify-center  p-2 text-xs uppercase flex-shrink-0 ${
                              !workspace?.logo && "rounded bg-custom-primary-500 text-white"
                            }`}
                          >
                            {workspace?.logo && workspace.logo !== "" ? (
                              <img
                                src={workspace.logo}
                                className="absolute top-0 left-0 h-full w-full object-cover rounded"
                                alt="Workspace Logo"
                              />
                            ) : (
                              workspace?.name?.charAt(0) ?? "..."
                            )}
                          </span>
                          {!sidebarCollapsed && (
                            <p className="truncate text-custom-sidebar-text-200 text-sm">{workspace.name}</p>
                          )}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <main className="relative flex flex-col h-full w-full overflow-hidden bg-custom-background-100">
            {header}
            <div className="flex gap-2 h-full w-full overflow-x-hidden overflow-y-scroll">
              <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
                <ProfileSettingsSidebar />
              </div>
              {children}
            </div>
          </main>
        </div>
      </UserAuthWrapper>
    </>
  );
});
