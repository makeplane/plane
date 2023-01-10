import React from "react";

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
  QuestionMarkCircleIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import { CyclesIcon } from "ui/icons";

type Props = {
  toggleSidebar: boolean;
  setToggleSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

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

  return (
    <nav className="relative z-40 h-screen">
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
                className={`flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
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
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
