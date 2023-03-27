import { useState, useRef, FC } from "react";

import Link from "next/link";

// headless ui
import { Transition } from "@headlessui/react";
// hooks
import useTheme from "hooks/use-theme";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// icons
import { ArrowLongLeftIcon, ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import {
  QuestionMarkCircleIcon,
  BoltIcon,
  DocumentIcon,
  DiscordIcon,
  GithubIcon,
} from "components/icons";

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

export const WorkspaceHelpSection: FC<WorkspaceHelpSectionProps> = (props) => {
  const { setSidebarActive } = props;
  // theme
  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);
  // refs
  const helpOptionsRef = useRef<HTMLDivElement | null>(null);
  // hooks
  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  const helpOptionMode = sidebarCollapse ? "left-full" : "left-[-75px]";

  return (
    <div
      className={`flex w-full items-center justify-between self-baseline border-t bg-white px-6 py-2 ${
        sidebarCollapse ? "flex-col" : ""
      }`}
    >
      <button
        type="button"
        className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
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
        <BoltIcon className="h-4 w-4 text-gray-500" />
        {!sidebarCollapse && <span>Shortcuts</span>}
      </button>
      <button
        type="button"
        className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
          sidebarCollapse ? "w-full justify-center" : ""
        }`}
        onClick={() => setIsNeedHelpOpen((prev) => !prev)}
        title="Help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />
        {!sidebarCollapse && <span>Help</span>}
      </button>
      <button
        type="button"
        className="flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 md:hidden"
        onClick={() => setSidebarActive(false)}
      >
        <ArrowLongLeftIcon className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-gray-900" />
      </button>
      <button
        type="button"
        className={`hidden items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 md:flex ${
          sidebarCollapse ? "w-full justify-center" : ""
        }`}
        onClick={() => toggleCollapsed()}
      >
        <ArrowLongLeftIcon
          className={`h-4 w-4 flex-shrink-0 text-gray-500 duration-300 group-hover:text-gray-900 ${
            sidebarCollapse ? "rotate-180" : ""
          }`}
        />
      </button>

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
            className={`absolute bottom-2 ${helpOptionMode} space-y-2 rounded-sm bg-white p-1 shadow-md`}
            ref={helpOptionsRef}
          >
            {helpOptions.map(({ name, Icon, href, onClick }) => {
              if (href)
                return (
                  <Link href={href} key={name}>
                    <a
                      target="_blank"
                      className="flex items-center gap-x-2 whitespace-nowrap rounded-md px-2 py-1 text-xs hover:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
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
                    className="flex w-full items-center gap-x-2 whitespace-nowrap rounded-md  px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{name}</span>
                  </button>
                );
            })}
          </div>
        </Transition>
      </div>
    </div>
  );
};
