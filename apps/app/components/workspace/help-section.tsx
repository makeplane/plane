import React from "react";

import Link from "next/link";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// component
import { Icon, Tooltip } from "components/ui";
// hooks
import useTheme from "hooks/use-theme";
// icons
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { DocumentIcon, DiscordIcon, GithubIcon } from "components/icons";

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: DocumentIcon,
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
  {
    name: "Chat with us",
    href: null,
    onClick: () => (window as any).$crisp.push(["do", "chat:show"]),
    Icon: ChatBubbleOvalLeftEllipsisIcon,
  },
];

export interface WorkspaceHelpSectionProps {
  setSidebarActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WorkspaceHelpSection: React.FC<WorkspaceHelpSectionProps> = (props) => {
  const { setSidebarActive } = props;
  // theme
  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  return (
    <div
      className={`flex w-full items-center justify-between self-baseline border-t border-brand-base bg-brand-sidebar gap-3 px-3.5 py-3 ${
        sidebarCollapse ? "flex-col" : ""
      }`}
    >
      <Tooltip
        tooltipContent="Shortcuts"
        position="right"
        className="ml-2"
        disabled={!sidebarCollapse}
      >
        <button
          type="button"
          className={`flex items-center gap-x-1 p-1.5 rounded-sm text-xs font-medium text-brand-secondary outline-none hover:bg-brand-surface-2 hover:text-brand-base ${
            sidebarCollapse ? "w-full justify-center" : ""
          }`}
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              key: "h",
            });
            document.dispatchEvent(e);
          }}
          title="Shortcuts"
        >
          <Icon iconName="rocket_launch" className="text-base leading-4" />
          {!sidebarCollapse && <span>Shortcuts</span>}
        </button>
      </Tooltip>

      <Popover className="relative flex h-full items-center rounded-sm justify-center hover:bg-brand-surface-2 hover:text-brand-base">
        {({ open }) => (
          <>
            <Tooltip
              tooltipContent="Help"
              position="right"
              className="ml-2"
              disabled={!sidebarCollapse}
            >
              <Popover.Button
                className={`flex h-full items-center py-1.5 px-2.5 gap-x-1 rounded-sm text-xs font-medium text-brand-secondary outline-none hover:text-brand-base ${
                  sidebarCollapse ? "w-full justify-center" : ""
                }`}
              >
                <Icon iconName="help" className="text-base leading-4" />
                {!sidebarCollapse && <span>Help</span>}
              </Popover.Button>
            </Tooltip>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Popover.Panel>
                <div
                  className={`absolute bottom-3 left-0 space-y-2 rounded-sm bg-brand-surface-2 p-1 shadow-md`}
                >
                  {helpOptions.map(({ name, Icon, href, onClick }) => {
                    if (href)
                      return (
                        <Link href={href} key={name}>
                          <a
                            target="_blank"
                            className="flex items-center gap-x-2 whitespace-nowrap rounded-sm px-2 py-1 text-xs hover:bg-brand-surface-1"
                          >
                            <Icon className="h-4 w-4 text-brand-secondary" />
                            <span className="text-sm">{name}</span>
                          </a>
                        </Link>
                      );
                    else
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={onClick ? onClick : undefined}
                          className="flex w-full items-center gap-x-2 whitespace-nowrap rounded-sm  px-2 py-1 text-xs hover:bg-brand-surface-1"
                        >
                          <Icon className="h-4 w-4 text-brand-secondary" />
                          <span className="text-sm">{name}</span>
                        </button>
                      );
                  })}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <button
        type="button"
        className="flex items-center gap-3 rounded-sm text-xs p-1.5 font-medium text-brand-secondary outline-none hover:bg-brand-surface-2 hover:text-brand-base md:hidden"
        onClick={() => setSidebarActive(false)}
      >
        <Icon iconName="keyboard_backspace" className="text-base leading-4" />
      </button>

      <Tooltip
        tooltipContent="Open Sidebar"
        position="right"
        className="ml-2"
        disabled={!sidebarCollapse}
      >
        <button
          type="button"
          className={`hidden items-center gap-3 p-1.5 rounded-sm text-xs font-medium text-brand-secondary outline-none hover:bg-brand-surface-2 hover:text-brand-base md:flex ${
            sidebarCollapse ? "w-full justify-center" : ""
          }`}
          onClick={() => toggleCollapsed()}
        >
          <Icon
            iconName="keyboard_backspace"
            className={`text-base leading-4 ${sidebarCollapse ? "rotate-180" : ""}`}
          />
        </button>
      </Tooltip>
    </div>
  );
};
