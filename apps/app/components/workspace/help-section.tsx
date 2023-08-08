import React, { useRef, useState } from "react";

import Link from "next/link";

// headless ui
import { Transition } from "@headlessui/react";
// hooks
import useTheme from "hooks/use-theme";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// icons
import { Bolt, HelpOutlineOutlined, WestOutlined } from "@mui/icons-material";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { DocumentIcon, DiscordIcon, GithubIcon } from "components/icons";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

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

export const WorkspaceHelpSection: React.FC<WorkspaceHelpSectionProps> = ({ setSidebarActive }) => {
  const store: any = useMobxStore();

  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);

  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  return (
    <>
      <div
        className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 py-2 px-4 ${
          store?.theme?.sidebarCollapsed ? "flex-col" : ""
        }`}
      >
        {!store?.theme?.sidebarCollapsed && (
          <div className="w-1/2 text-center cursor-default rounded-md px-2.5 py-1.5 font-medium outline-none text-sm bg-green-500/10 text-green-500">
            Free Plan
          </div>
        )}
        <div
          className={`flex items-center gap-1 ${
            store?.theme?.sidebarCollapsed ? "flex-col justify-center" : "justify-evenly w-1/2"
          }`}
        >
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "h",
              });
              document.dispatchEvent(e);
            }}
          >
            <Bolt fontSize="small" />
          </button>
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpOutlineOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className="grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none md:hidden"
            onClick={() => setSidebarActive(false)}
          >
            <WestOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className={`hidden md:grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => store.theme.setSidebarCollapsed(!store?.theme?.sidebarCollapsed)}
          >
            <WestOutlined
              fontSize="small"
              className={`duration-300 ${store?.theme?.sidebarCollapsed ? "rotate-180" : ""}`}
            />
          </button>
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
              className={`absolute bottom-2 ${
                store?.theme?.sidebarCollapsed ? "left-full" : "left-[-75px]"
              } space-y-2 rounded-sm bg-custom-background-80 p-1 shadow-md`}
              ref={helpOptionsRef}
            >
              {helpOptions.map(({ name, Icon, href, onClick }) => {
                if (href)
                  return (
                    <Link href={href} key={name}>
                      <a
                        target="_blank"
                        className="flex items-center gap-x-2 whitespace-nowrap rounded-md px-2 py-1 text-xs hover:bg-custom-background-90"
                      >
                        <Icon className="h-4 w-4 text-custom-text-200" />
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
                      className="flex w-full items-center gap-x-2 whitespace-nowrap rounded-md  px-2 py-1 text-xs hover:bg-custom-background-90"
                    >
                      <Icon className="h-4 w-4 text-custom-sidebar-text-200" />
                      <span className="text-sm">{name}</span>
                    </button>
                  );
              })}
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
};
