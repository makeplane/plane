import React, { useRef, useState } from "react";
import Link from "next/link";
import { Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// icons
import { Bolt, HelpOutlineOutlined, WestOutlined } from "@mui/icons-material";
import { DiscordIcon } from "components/icons";
import { FileText, Github, MessagesSquare } from "lucide-react";
// assets
import packageJson from "package.json";

const helpOptions = [
  {
    name: "Documentation",
    href: "https://docs.plane.so/",
    Icon: FileText,
  },
  {
    name: "Join our Discord",
    href: "https://discord.com/invite/A92xrEGCge",
    Icon: DiscordIcon,
  },
  {
    name: "Report a bug",
    href: "https://github.com/makeplane/plane/issues/new/choose",
    Icon: Github,
  },
  {
    name: "Chat with us",
    href: null,
    onClick: () => (window as any).$crisp.push(["do", "chat:show"]),
    Icon: MessagesSquare,
  },
];

export interface WorkspaceHelpSectionProps {
  setSidebarActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WorkspaceHelpSection: React.FC<WorkspaceHelpSectionProps> = observer(() => {
  // store
  const { theme: themeStore } = useMobxStore();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  return (
    <>
      <div
        className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 py-2 px-4 ${
          themeStore?.sidebarCollapsed ? "flex-col" : ""
        }`}
      >
        {!themeStore?.sidebarCollapsed && (
          <div className="w-1/2 text-center cursor-default rounded-md px-2.5 py-1.5 font-medium outline-none text-sm bg-green-500/10 text-green-500">
            Free Plan
          </div>
        )}
        <div
          className={`flex items-center gap-1 ${
            themeStore?.sidebarCollapsed ? "flex-col justify-center" : "justify-evenly w-1/2"
          }`}
        >
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              themeStore?.sidebarCollapsed ? "w-full" : ""
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
              themeStore?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpOutlineOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className="grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none md:hidden"
            onClick={() => themeStore.setSidebarCollapsed(!themeStore?.sidebarCollapsed)}
          >
            <WestOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className={`hidden md:grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              themeStore?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => themeStore.setSidebarCollapsed(!themeStore?.sidebarCollapsed)}
          >
            <WestOutlined
              fontSize="small"
              className={`duration-300 ${themeStore?.sidebarCollapsed ? "rotate-180" : ""}`}
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
              className={`absolute bottom-2 min-w-[10rem] ${
                themeStore?.sidebarCollapsed ? "left-full" : "-left-[75px]"
              } rounded bg-custom-background-100 p-1 shadow-custom-shadow-xs whitespace-nowrap divide-y divide-custom-border-200`}
              ref={helpOptionsRef}
            >
              <div className="space-y-1 pb-2">
                {helpOptions.map(({ name, Icon, href, onClick }) => {
                  if (href)
                    return (
                      <Link href={href} key={name}>
                        <a
                          target="_blank"
                          className="flex items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
                        >
                          <div className="grid place-items-center flex-shrink-0">
                            <Icon className="text-custom-text-200 h-3.5 w-3.5" size={14} />
                          </div>
                          <span className="text-xs">{name}</span>
                        </a>
                      </Link>
                    );
                  else
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={onClick ?? undefined}
                        className="flex w-full items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
                      >
                        <div className="grid place-items-center flex-shrink-0">
                          <Icon className="text-custom-text-200 h-3.5 w-3.5" size={14} />
                        </div>
                        <span className="text-xs">{name}</span>
                      </button>
                    );
                })}
              </div>
              <div className="px-2 pt-2 pb-1 text-[10px]">Version: v{packageJson.version}</div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
});
