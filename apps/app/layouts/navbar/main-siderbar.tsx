import React, { useEffect, useState } from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import useTheme from "lib/hooks/useTheme";
// components
import ProjectsList from "components/sidebar/projects-list";
import WorkspaceOptions from "components/sidebar/workspace-options";
// headless ui
import { Transition } from "@headlessui/react";
// icons
import {
  ArrowPathIcon,
  Bars3Icon,
  Cog6ToothIcon,
  RectangleStackIcon,
  XMarkIcon,
  ArrowLongLeftIcon,
  QuestionMarkCircleIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
// common
import { classNames } from "constants/common";

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    icon: RectangleStackIcon,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: ArrowPathIcon,
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

const Sidebar: React.FC = () => {
  const router = useRouter();

  const { workspaceSlug, projectId } = router.query;

  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  return (
    <nav className="h-screen">
      <Transition.Root show={sidebarCollapse} as={React.Fragment}>
        <div className="relative z-40 md:hidden">
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => toggleCollapsed()}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <nav className="mt-5 space-y-1 px-2">
                    {projectId &&
                      navigation(workspaceSlug as string, projectId as string).map((item) => (
                        <Link href={item.href} key={item.name}>
                          <a
                            className={classNames(
                              item.href === router.asPath
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "group flex items-center rounded-md px-2 py-2 text-base font-medium"
                            )}
                          >
                            <item.icon
                              className={classNames(
                                item.href === router.asPath
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-gray-500",
                                "mr-4 h-6 w-6 flex-shrink-0"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </a>
                        </Link>
                      ))}
                  </nav>
                </div>
              </div>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" />
          </div>
        </div>
      </Transition.Root>
      <div
        className={`${
          sidebarCollapse ? "" : "w-auto md:w-60"
        } hidden h-full md:inset-y-0 md:flex md:flex-col`}
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
                className={`flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-gray-500 outline-none hover:bg-gray-100 hover:text-gray-900 ${
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

      <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => toggleCollapsed()}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
