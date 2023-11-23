import Link from "next/link";
import { observer } from "mobx-react-lite";
import { MoveLeft, Plus, UserPlus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Tooltip } from "@plane/ui";

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

export const ProfileLayoutSidebar = observer(() => {
  const {
    theme: { sidebarCollapsed, toggleSidebar },
    workspace: { workspaces },
  } = useMobxStore();

  return (
    <div
      className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="h-full w-full flex flex-col">
        <div className="w-full cursor-pointer space-y-1 p-4 flex-shrink-0">
          {SIDEBAR_LINKS.map((link) => (
            <Link key={link.key} href={link.href}>
              <a className="block w-full">
                <Tooltip tooltipContent={link.name} position="right" className="ml-2" disabled={!sidebarCollapsed}>
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
          <div className="flex flex-col px-4 flex-shrink-0">
            {!sidebarCollapsed && (
              <div className="rounded text-custom-sidebar-text-400 px-1.5 text-sm font-semibold">Your workspaces</div>
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
        <div className="flex-grow flex items-end px-4 py-2">
          <button
            type="button"
            className="grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none md:hidden"
            onClick={() => toggleSidebar()}
          >
            <MoveLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={`hidden md:grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ml-auto ${
              sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar()}
          >
            <MoveLeft className={`h-3.5 w-3.5 duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
});
