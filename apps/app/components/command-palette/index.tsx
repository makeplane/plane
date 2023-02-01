// TODO: Refactor this component: into a different file, use this file to export the components
import React, { useState, useCallback, useEffect } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// hooks
import { Combobox, Dialog, Transition } from "@headlessui/react";
import {
  FolderIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import useTheme from "hooks/use-theme";
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// services
import userService from "services/user.service";
// components
import ShortcutsModal from "components/command-palette/shortcuts";
import { CreateProjectModal } from "components/project";
import { CreateUpdateIssueModal } from "components/issues/modal";
import CreateUpdateCycleModal from "components/project/cycles/create-update-cycle-modal";
import CreateUpdateModuleModal from "components/project/modules/create-update-module-modal";
import BulkDeleteIssuesModal from "components/common/bulk-delete-issues-modal";
// headless ui
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";
// ui
import { Button } from "components/ui";
// icons
// fetch-keys
import { USER_ISSUE } from "constants/fetch-keys";

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState("");

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isBulkDeleteIssuesModalOpen, setIsBulkDeleteIssuesModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();
  const { toggleCollapsed } = useTheme();

  const { data: myIssues } = useSWR<IIssue[]>(
    workspaceSlug ? USER_ISSUE(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userIssues(workspaceSlug as string) : null
  );

  const filteredIssues: IIssue[] =
    query === ""
      ? myIssues ?? []
      : myIssues?.filter(
          (issue) =>
            issue.name.toLowerCase().includes(query.toLowerCase()) ||
            `${issue.project_detail.identifier}-${issue.sequence_id}`
              .toLowerCase()
              .includes(query.toLowerCase())
        ) ?? [];

  const quickActions = [
    {
      name: "Add new issue...",
      icon: RectangleStackIcon,
      hide: !projectId,
      shortcut: "I",
      onClick: () => {
        setIsIssueModalOpen(true);
      },
    },
    {
      name: "Add new project...",
      icon: ClipboardDocumentListIcon,
      hide: !workspaceSlug,
      shortcut: "P",
      onClick: () => {
        setIsProjectModalOpen(true);
      },
    },
  ];

  const handleCommandPaletteClose = () => {
    setIsPaletteOpen(false);
    setQuery("");
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target as Element).classList?.contains("remirror-editor")
      ) {
        if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
          e.preventDefault();
          setIsPaletteOpen(true);
        } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
          if (e.altKey) {
            e.preventDefault();
            if (!router.query.issueId) return;

            const url = new URL(window.location.href);
            console.log(url);
            copyTextToClipboard(url.href)
              .then(() => {
                setToastAlert({
                  type: "success",
                  title: "Copied to clipboard",
                });
              })
              .catch(() => {
                setToastAlert({
                  type: "error",
                  title: "Some error occurred",
                });
              });
            console.log("URL Copied");
          } else {
            console.log("Text copied");
          }
        } else if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          setIsIssueModalOpen(true);
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          setIsProjectModalOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
          e.preventDefault();
          toggleCollapsed();
        } else if (e.key === "h" || e.key === "H") {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
        } else if (e.key === "q" || e.key === "Q") {
          e.preventDefault();
          setIsCreateCycleModalOpen(true);
        } else if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          setIsCreateModuleModalOpen(true);
        } else if (e.key === "Delete") {
          e.preventDefault();
          setIsBulkDeleteIssuesModalOpen(true);
        }
      }
    },
    [toggleCollapsed, setToastAlert, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;

  return (
    <>
      <ShortcutsModal isOpen={isShortcutsModalOpen} setIsOpen={setIsShortcutsModalOpen} />
      {workspaceSlug && (
        <CreateProjectModal isOpen={isProjectModalOpen} setIsOpen={setIsProjectModalOpen} />
      )}
      {projectId && (
        <>
          <CreateUpdateCycleModal
            isOpen={isCreateCycleModalOpen}
            setIsOpen={setIsCreateCycleModalOpen}
            projectId={projectId as string}
          />
          <CreateUpdateModuleModal
            isOpen={isCreateModuleModalOpen}
            setIsOpen={setIsCreateModuleModalOpen}
            projectId={projectId as string}
          />
        </>
      )}
      <CreateUpdateIssueModal
        isOpen={isIssueModalOpen}
        handleClose={() => setIsIssueModalOpen(false)}
      />
      <BulkDeleteIssuesModal
        isOpen={isBulkDeleteIssuesModalOpen}
        setIsOpen={setIsBulkDeleteIssuesModalOpen}
      />
      <Transition.Root
        show={isPaletteOpen}
        as={React.Fragment}
        afterLeave={() => setQuery("")}
        appear
      >
        <Dialog as="div" className="relative z-20" onClose={handleCommandPaletteClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 rounded-xl bg-white bg-opacity-80 shadow-2xl ring-1 ring-black ring-opacity-5 backdrop-blur backdrop-filter transition-all">
                <Combobox
                  onChange={(value: any) => {
                    if (value?.url) router.push(value.url);
                    else if (value?.onClick) value.onClick();
                    handleCommandPaletteClose();
                  }}
                >
                  <div className="relative m-1">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                      placeholder="Search..."
                      autoComplete="off"
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                  >
                    {filteredIssues.length > 0 && (
                      <>
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                              Select issues
                            </h2>
                          )}
                          <ul className="text-sm text-gray-700">
                            {filteredIssues.map((issue) => (
                              <Combobox.Option
                                key={issue.id}
                                as="label"
                                htmlFor={`issue-${issue.id}`}
                                value={{
                                  name: issue.name,
                                  url: `/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`,
                                }}
                                className={({ active }) =>
                                  `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 ${
                                    active ? "bg-gray-500 bg-opacity-5 text-gray-900" : ""
                                  }`
                                }
                              >
                                {({ active }) => (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                        style={{
                                          backgroundColor: issue.state_detail.color,
                                        }}
                                      />
                                      <span className="flex-shrink-0 text-xs text-gray-500">
                                        {issue.project_detail?.identifier}-{issue.sequence_id}
                                      </span>
                                      <span>{issue.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className={`flex-shrink-0 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-500 transition-opacity duration-75 hover:bg-gray-500 hover:bg-opacity-5 ${
                                        active
                                          ? "pointer-events-auto opacity-100"
                                          : "pointer-events-none opacity-0"
                                      }`}
                                    >
                                      Jump to
                                    </button>
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      </>
                    )}
                    {query === "" && (
                      <li className="p-2">
                        <h2 className="sr-only">Quick actions</h2>
                        <ul className="text-sm text-gray-700">
                          {quickActions.map(
                            (action) =>
                              !action.hide && (
                                <Combobox.Option
                                  key={action.shortcut}
                                  value={{
                                    name: action.name,
                                    onClick: action.onClick,
                                  }}
                                  className={({ active }) =>
                                    `flex cursor-default select-none items-center rounded-md px-3 py-2 ${
                                      active ? "bg-gray-500 bg-opacity-5 text-gray-900" : ""
                                    }`
                                  }
                                >
                                  {({ active }) => (
                                    <>
                                      <action.icon
                                        className={`h-6 w-6 flex-none text-gray-900 text-opacity-40 ${
                                          active ? "text-opacity-100" : ""
                                        }`}
                                        aria-hidden="true"
                                      />
                                      <span className="ml-3 flex-auto truncate">{action.name}</span>
                                      <span className="ml-3 flex-none text-xs font-semibold text-gray-500">
                                        <kbd className="font-sans">⌘</kbd>
                                        <kbd className="font-sans">{action.shortcut}</kbd>
                                      </span>
                                    </>
                                  )}
                                </Combobox.Option>
                              )
                          )}
                        </ul>
                      </li>
                    )}
                  </Combobox.Options>

                  {query !== "" && filteredIssues.length === 0 && (
                    <div className="py-14 px-6 text-center sm:px-14">
                      <FolderIcon
                        className="mx-auto h-6 w-6 text-gray-500 text-opacity-40"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-sm text-gray-900">
                        We couldn{"'"}t find any issue with that term. Please try again.
                      </p>
                    </div>
                  )}
                </Combobox>

                <div className="flex items-center justify-end gap-2 p-3">
                  <div>
                    <Button type="button" size="sm" onClick={handleCommandPaletteClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default CommandPalette;
