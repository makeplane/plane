import { FC, useState, useRef } from "react";
import { Transition } from "@headlessui/react";
import Link from "next/link";
import { FileText, HelpCircle, MessagesSquare, MoveLeft } from "lucide-react";
// hooks
import { useApplication } from "hooks/store";
// icons
import { DiscordIcon, GithubIcon } from "@plane/ui";
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
    Icon: GithubIcon,
  },
  {
    name: "Chat with us",
    href: null,
    onClick: () => (window as any).$crisp.push(["do", "chat:show"]),
    Icon: MessagesSquare,
  },
];

export const InstanceHelpSection: FC = () => {
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // store
  const {
    theme: { sidebarCollapsed, toggleSidebar },
  } = useApplication();
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 px-4 py-2 ${
        sidebarCollapsed ? "flex-col" : ""
      }`}
    >
      <div className={`flex items-center gap-1 ${sidebarCollapsed ? "flex-col justify-center" : "w-full justify-end"}`}>
        <button
          type="button"
          className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
            sidebarCollapsed ? "w-full" : ""
          }`}
          onClick={() => setIsNeedHelpOpen((prev) => !prev)}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="grid place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:hidden"
          onClick={() => toggleSidebar()}
        >
          <MoveLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={`hidden place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:grid ${
            sidebarCollapsed ? "w-full" : ""
          }`}
          onClick={() => toggleSidebar()}
        >
          <MoveLeft className={`h-3.5 w-3.5 duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
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
              sidebarCollapsed ? "left-full" : "-left-[75px]"
            } divide-y divide-custom-border-200 whitespace-nowrap rounded bg-custom-background-100 p-1 shadow-custom-shadow-xs`}
            ref={helpOptionsRef}
          >
            <div className="space-y-1 pb-2">
              {helpOptions.map(({ name, Icon, href, onClick }) => {
                if (href)
                  return (
                    <Link href={href} key={name} target="_blank">
                      <div className="flex items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80">
                        <div className="grid flex-shrink-0 place-items-center">
                          <Icon className="h-3.5 w-3.5 text-custom-text-200" size={14} />
                        </div>
                        <span className="text-xs">{name}</span>
                      </div>
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
                      <div className="grid flex-shrink-0 place-items-center">
                        <Icon className="h-3.5 w-3.5 text-custom-text-200" />
                      </div>
                      <span className="text-xs">{name}</span>
                    </button>
                  );
              })}
            </div>
            <div className="px-2 pb-1 pt-2 text-[10px]">Version: v{packageJson.version}</div>
          </div>
        </Transition>
      </div>
    </div>
  );
};
