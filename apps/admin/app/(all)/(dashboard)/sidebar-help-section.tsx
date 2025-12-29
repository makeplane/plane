import { useState, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { HelpCircle, MoveLeft } from "lucide-react";
import { Transition } from "@headlessui/react";
import { WEB_BASE_URL } from "@plane/constants";
// plane internal packages
import { DiscordIcon, GithubIcon, NewTabIcon, PageIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useInstance, useTheme } from "@/hooks/store";
// assets

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: PageIcon,
  },
  {
    name: "Join our Discord",
    href: "https://discord.com/invite/A92xrEGCge",
    Icon: DiscordIcon,
  },
  {
    name: "Report a bug",
    href: "https://github.com/makeplane/plane/issues/new/choose",
    Icon: GithubIcon,
  },
];

export const AdminSidebarHelpSection = observer(function AdminSidebarHelpSection() {
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // store
  const { instance } = useInstance();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const redirectionLink = encodeURI(WEB_BASE_URL + "/");

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-1 self-baseline border-t border-subtle bg-surface-1 px-4 h-14 flex-shrink-0",
        {
          "flex-col h-auto py-1.5": isSidebarCollapsed,
        }
      )}
    >
      <div className={`flex items-center gap-1 ${isSidebarCollapsed ? "flex-col justify-center" : "w-full"}`}>
        <Tooltip tooltipContent="Redirect to Plane" position="right" className="ml-4" disabled={!isSidebarCollapsed}>
          <a
            href={redirectionLink}
            className={`relative px-2 py-1 flex items-center gap-1 rounded-sm bg-layer-1 text-body-xs-medium text-secondary whitespace-nowrap`}
          >
            <NewTabIcon width={14} height={14} />
            {!isSidebarCollapsed && "Redirect to Plane"}
          </a>
        </Tooltip>
        <Tooltip tooltipContent="Help" position={isSidebarCollapsed ? "right" : "top"} className="ml-4">
          <button
            type="button"
            className={`ml-auto grid place-items-center rounded-md p-1.5 text-secondary outline-none hover:bg-layer-1-hover hover:text-primary ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpCircle className="size-4" />
          </button>
        </Tooltip>
        <Tooltip tooltipContent="Toggle sidebar" position={isSidebarCollapsed ? "right" : "top"} className="ml-4">
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-secondary outline-none hover:bg-layer-1-hover hover:text-primary ${
              isSidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar(!isSidebarCollapsed)}
          >
            <MoveLeft className={`size-4 duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </Tooltip>
      </div>

      <div className="relative">
        <Transition
          show={isNeedHelpOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div
            className={`absolute bottom-2 min-w-[10rem] z-[15] ${
              isSidebarCollapsed ? "left-full" : "-left-[75px]"
            } divide-y divide-subtle-1 whitespace-nowrap rounded-sm bg-surface-1 p-1 shadow-raised-100`}
            ref={helpOptionsRef}
          >
            <div className="space-y-1 pb-2">
              {helpOptions.map(({ name, Icon, href }) => {
                if (href)
                  return (
                    <Link href={href} key={name} target="_blank">
                      <div className="flex items-center gap-x-2 rounded-sm px-2 py-1 text-11 hover:bg-layer-1-hover">
                        <div className="grid flex-shrink-0 place-items-center">
                          <Icon className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <span className="text-11">{name}</span>
                      </div>
                    </Link>
                  );
                else
                  return (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-center gap-x-2 rounded-sm px-2 py-1 text-11 hover:bg-layer-1"
                    >
                      <div className="grid flex-shrink-0 place-items-center">
                        <Icon className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <span className="text-11">{name}</span>
                    </button>
                  );
              })}
            </div>
            <div className="px-2 pb-1 pt-2 text-10">Version: v{instance?.current_version}</div>
          </div>
        </Transition>
      </div>
    </div>
  );
});
