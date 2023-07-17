import React, { useRef, useState } from "react";

import { useRouter } from "next/router";

import Link from "next/link";

import useSWR from "swr";

// headless ui
import { Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// hooks
import useTheme from "hooks/use-theme";
import useUser from "hooks/use-user";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import UpgradeToProModal from "./upgrade-to-pro-modal";
// ui
import { CircularProgress } from "components/ui";
// icons
import {
  ArrowLongLeftIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  RocketLaunchIcon,
  ArrowUpCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { QuestionMarkCircleIcon, DocumentIcon, DiscordIcon, GithubIcon } from "components/icons";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";

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
  const [alert, setAlert] = useState(false);
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);

  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  const { user } = useUser();

  const [upgradeModal, setUpgradeModal] = useState(false);

  const { data: workspaceDetails } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.getWorkspace(workspaceSlug as string) : null
  );

  const issueNumber = workspaceDetails?.total_issues || 0;

  return (
    <>
      <UpgradeToProModal
        isOpen={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        user={user}
        issueNumber={issueNumber}
      />
      {!sidebarCollapse && (alert || issueNumber >= 750) && (
        <div
          className={`border-t border-custom-sidebar-border-200 p-4 ${
            issueNumber >= 750
              ? "bg-red-500/10 text-red-600"
              : issueNumber >= 500
              ? "bg-yellow-500/10 text-yellow-600"
              : "text-green-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <CircularProgress progress={(issueNumber / 1024) * 100} />
            <div>Free Plan</div>
            {issueNumber < 750 && (
              <div
                className="ml-auto text-custom-text-200 cursor-pointer"
                onClick={() => setAlert(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="text-custom-text-200 text-xs mt-2">
            This workspace has used {issueNumber} of its 1024 issues creation limit (
            {((issueNumber / 1024) * 100).toFixed(0)}
            %).
          </div>
        </div>
      )}
      <div
        className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 px-4 py-2 ${
          sidebarCollapse ? "flex-col" : ""
        }`}
      >
        {alert || issueNumber >= 750 ? (
          <button
            type="button"
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium outline-none text-sm ${
              issueNumber >= 750
                ? "bg-red-500/10 text-red-500"
                : "bg-blue-500/10 text-custom-primary-100"
            } ${sidebarCollapse ? "w-full justify-center" : ""}`}
            title="Shortcuts"
            onClick={() => setUpgradeModal(true)}
          >
            <ArrowUpCircleIcon className="h-4 w-4" />
            {!sidebarCollapse && <span>Learn more</span>}
          </button>
        ) : (
          <button
            type="button"
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium outline-none text-sm ${
              issueNumber >= 750
                ? "bg-red-500/10 text-red-600"
                : issueNumber >= 500
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-green-500/10 text-green-600"
            }
            ${sidebarCollapse ? "w-full justify-center" : ""}`}
            title="Shortcuts"
            onClick={() => setAlert(true)}
          >
            <CircularProgress
              progress={(issueNumber / 1024) * 100 > 100 ? 100 : (issueNumber / 1024) * 100}
            />
            {!sidebarCollapse && <span>Free Plan</span>}
          </button>
        )}
        <button
          type="button"
          className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
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
          <RocketLaunchIcon className="h-4 w-4 text-custom-text-200" />
        </button>
        <button
          type="button"
          className={`flex items-center gap-x-1 rounded-md px-2 py-2 text-xs font-medium text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 ${
            sidebarCollapse ? "w-full justify-center" : ""
          }`}
          onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          title="Help"
        >
          <QuestionMarkCircleIcon className="h-4 w-4 text-custom-text-200" />
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:hidden"
          onClick={() => setSidebarActive(false)}
        >
          <ArrowLongLeftIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200 group-hover:text-custom-text-100" />
        </button>
        <button
          type="button"
          className={`hidden items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:flex ${
            sidebarCollapse ? "w-full justify-center" : ""
          }`}
          onClick={() => toggleCollapsed()}
        >
          <ArrowLongLeftIcon
            className={`h-4 w-4 flex-shrink-0 text-custom-text-200 duration-300 group-hover:text-custom-text-100 ${
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
              className={`absolute bottom-2 ${
                sidebarCollapse ? "left-full" : "left-[-75px]"
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
