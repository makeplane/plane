import React, { useState } from "react";

import Link from "next/link";

import { Transition } from "@headlessui/react";

// hooks
import useTheme from "lib/hooks/useTheme";
// components
import ProjectsList from "components/sidebar/projects-list";
import WorkspaceOptions from "components/sidebar/workspace-options";
// icons
import {
  Cog6ToothIcon,
  RectangleStackIcon,
  ArrowLongLeftIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import {
  CyclesIcon,
  QuestionMarkCircleIcon,
  BoltIcon,
  DocumentIcon,
  DiscordIcon,
  GithubIcon,
  CommentIcon,
} from "ui/icons";

type Props = {
  toggleSidebar: boolean;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

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
    href: "mailto:hello@plane.so",
    Icon: CommentIcon,
  },
];

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    icon: RectangleStackIcon,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: CyclesIcon,
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    icon: RectangleGroupIcon,
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    icon: Cog6ToothIcon,
  },
];

const Sidebar: React.FC<Props> = ({ toggleSidebar, setToggleSidebar }) => {
  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);

  return (
    <nav className="relative z-20 h-screen md:z-0">
      <div
        className={`${sidebarCollapse ? "" : "w-auto md:w-60"} fixed inset-y-0 top-0 ${
          toggleSidebar ? "left-0" : "-left-60 md:left-0"
        } flex h-full flex-col bg-white duration-300 md:relative`}
      >
        <div className="flex h-full flex-1 flex-col border-r border-gray-200">
          <div className="flex h-full flex-1 flex-col pt-2">
            <WorkspaceOptions sidebarCollapse={sidebarCollapse} />
            <ProjectsList navigation={navigation} sidebarCollapse={sidebarCollapse} />
            <div
              className={`flex w-full items-center self-baseline bg-primary px-2 py-2 ${
                sidebarCollapse ? "flex-col-reverse" : ""
              }`}
            >
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
              <button
                type="button"
                className="flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 md:hidden"
                onClick={() => setToggleSidebar(false)}
              >
                <ArrowLongLeftIcon className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-gray-900" />
              </button>
              <button
                type="button"
                className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
                  sidebarCollapse ? "w-full justify-center" : ""
                }`}
                onClick={() => {
                  const e = new KeyboardEvent("keydown", {
                    ctrlKey: true,
                    key: "h",
                  });
                  document.dispatchEvent(e);
                }}
                title="Help"
              >
                <BoltIcon className="h-4 w-4 text-gray-500" />
                {!sidebarCollapse && <span>Shortcuts</span>}
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
                  <div className="absolute bottom-0 left-full space-y-2 rounded-sm bg-white py-3 shadow-md">
                    {helpOptions.map(({ name, Icon, href }) => (
                      <Link href={href} key={name}>
                        <a
                          target="_blank"
                          className="mx-3 flex items-center gap-x-2 rounded-md px-2 py-2 text-xs hover:bg-gray-100"
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <span className="text-sm">{name}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </Transition>
                <button
                  type="button"
                  className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
                    sidebarCollapse ? "w-full justify-center" : ""
                  }`}
                  onClick={() => setIsNeedHelpOpen((prev) => !prev)}
                  title="Help"
                >
                  <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />
                  {!sidebarCollapse && <span>Need help?</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
