import React, { useState, useCallback, useEffect } from "react";
// next
import { useRouter } from "next/router";
// swr
import { mutate } from "swr";
// react hook form
import { SubmitHandler, useForm } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
import useTheme from "lib/hooks/useTheme";
import useToast from "lib/hooks/useToast";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  FolderIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
// commons
import { classNames, copyTextToClipboard } from "constants/common";
// components
import ShortcutsModal from "components/command-palette/shortcuts";
import CreateProjectModal from "components/project/CreateProjectModal";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import CreateUpdateCycleModal from "components/project/cycles/CreateUpdateCyclesModal";
// types
import { IIssue, IProject, IssueResponse } from "types";
import { Button } from "ui";
import issuesServices from "lib/services/issues.services";
// fetch keys
import { PROJECTS_LIST, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type ItemType = {
  name: string;
  url?: string;
  onClick?: () => void;
};

type FormInput = {
  issue_ids: string[];
};

const CommandPalette: React.FC = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);

  const { activeWorkspace, activeProject, issues, cycles } = useUser();

  const { toggleCollapsed } = useTheme();

  const { setToastAlert } = useToast();

  const filteredIssues: IIssue[] =
    query === ""
      ? issues?.results ?? []
      : issues?.results.filter((issue) => issue.name.toLowerCase().includes(query.toLowerCase())) ??
        [];

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
  } = useForm<FormInput>();

  const quickActions = [
    {
      name: "Add new issue...",
      icon: RectangleStackIcon,
      shortcut: "I",
      onClick: () => {
        setIsIssueModalOpen(true);
      },
    },
    {
      name: "Add new project...",
      icon: ClipboardDocumentListIcon,
      shortcut: "P",
      onClick: () => {
        setIsProjectModalOpen(true);
      },
    },
  ];

  const handleCommandPaletteClose = () => {
    setIsPaletteOpen(false);
    setQuery("");
    reset();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsPaletteOpen(true);
      } else if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        setIsIssueModalOpen(true);
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setIsProjectModalOpen(true);
      } else if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      } else if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      } else if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        setIsCreateCycleModalOpen(true);
      } else if (e.ctrlKey && e.altKey && e.key === "c") {
        e.preventDefault();

        if (!router.query.issueId) return;

        const url = new URL(window.location.href);
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
      }
    },
    [toggleCollapsed, setToastAlert, router]
  );

  const handleDelete: SubmitHandler<FormInput> = (data) => {
    if (activeWorkspace && activeProject && data.issue_ids) {
      issuesServices
        .bulkDeleteIssues(activeWorkspace.slug, activeProject.id, data)
        .then((res) => {
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => {
              return {
                ...(prevData as IssueResponse),
                count: (prevData?.results ?? []).filter(
                  (p) => !data.issue_ids.some((id) => p.id === id)
                ).length,
                results: (prevData?.results ?? []).filter(
                  (p) => !data.issue_ids.some((id) => p.id === id)
                ),
              };
            },
            false
          );
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  const handleAddToCycle: SubmitHandler<FormInput> = (data) => {
    if (activeWorkspace && activeProject && data.issue_ids) {
      issuesServices
        .bulkAddIssuesToCycle(activeWorkspace.slug, activeProject.id, "", data)
        .then((res) => {})
        .catch((e) => {
          console.log(e);
        });
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <ShortcutsModal isOpen={isShortcutsModalOpen} setIsOpen={setIsShortcutsModalOpen} />
      <CreateProjectModal isOpen={isProjectModalOpen} setIsOpen={setIsProjectModalOpen} />
      {activeProject && (
        <CreateUpdateCycleModal
          isOpen={isCreateCycleModalOpen}
          setIsOpen={setIsCreateCycleModalOpen}
          projectId={activeProject.id}
        />
      )}
      <CreateUpdateIssuesModal
        isOpen={isIssueModalOpen}
        setIsOpen={setIsIssueModalOpen}
        projectId={activeProject?.id}
      />
      <Transition.Root
        show={isPaletteOpen}
        as={React.Fragment}
        afterLeave={() => setQuery("")}
        appear
      >
        <Dialog as="div" className="relative z-10" onClose={handleCommandPaletteClose}>
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

          <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 overflow-hidden rounded-xl bg-white bg-opacity-80 shadow-2xl ring-1 ring-black ring-opacity-5 backdrop-blur backdrop-filter transition-all">
                <form>
                  <Combobox
                  // onChange={(item: ItemType) => {
                  //   const { url, onClick } = item;
                  //   if (url) router.push(url);
                  //   else if (onClick) onClick();
                  //   handleCommandPaletteClose();
                  // }}
                  >
                    <div className="relative m-1">
                      <MagnifyingGlassIcon
                        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                        aria-hidden="true"
                      />
                      <Combobox.Input
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm outline-none"
                        placeholder="Search..."
                        onChange={(event) => setQuery(event.target.value)}
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
                                Issues
                              </h2>
                            )}
                            <ul className="text-sm text-gray-700">
                              {filteredIssues.map((issue) => (
                                <Combobox.Option
                                  key={issue.id}
                                  value={{
                                    name: issue.name,
                                    url: `/projects/${issue.project}/issues/${issue.id}`,
                                  }}
                                  className={({ active }) =>
                                    classNames(
                                      "flex cursor-pointer select-none items-center rounded-md px-3 py-2",
                                      active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                    )
                                  }
                                >
                                  {({ active }) => (
                                    <>
                                      {/* <FolderIcon
                                      className={classNames(
                                        "h-6 w-6 flex-none text-gray-900 text-opacity-40",
                                        active ? "text-opacity-100" : ""
                                      )}
                                      aria-hidden="true"
                                    /> */}
                                      <input
                                        type="checkbox"
                                        {...register("issue_ids")}
                                        id={`issue-${issue.id}`}
                                        value={issue.id}
                                      />
                                      <label
                                        htmlFor={`issue-${issue.id}`}
                                        className="ml-3 flex-auto truncate"
                                      >
                                        {issue.name}
                                      </label>
                                      {active && (
                                        <span className="ml-3 flex-none text-gray-500">
                                          Jump to...
                                        </span>
                                      )}
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
                            {quickActions.map((action) => (
                              <Combobox.Option
                                key={action.shortcut}
                                value={{
                                  name: action.name,
                                  onClick: action.onClick,
                                }}
                                className={({ active }) =>
                                  classNames(
                                    "flex cursor-default select-none items-center rounded-md px-3 py-2",
                                    active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                  )
                                }
                              >
                                {({ active }) => (
                                  <>
                                    <action.icon
                                      className={classNames(
                                        "h-6 w-6 flex-none text-gray-900 text-opacity-40",
                                        active ? "text-opacity-100" : ""
                                      )}
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
                            ))}
                          </ul>
                        </li>
                      )}
                    </Combobox.Options>

                    {query !== "" && filteredIssues.length === 0 && (
                      <div className="py-14 px-6 text-center sm:px-14">
                        <FolderIcon
                          className="mx-auto h-6 w-6 text-gray-900 text-opacity-40"
                          aria-hidden="true"
                        />
                        <p className="mt-4 text-sm text-gray-900">
                          We couldn{"'"}t find any issue with that term. Please try again.
                        </p>
                      </div>
                    )}
                  </Combobox>

                  <div className="flex justify-between items-center gap-2 p-3">
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSubmit(handleAddToCycle)} size="sm">
                        Add to Cycle
                      </Button>
                      <Button onClick={handleSubmit(handleDelete)} theme="danger" size="sm">
                        Delete
                      </Button>
                    </div>
                    <div>
                      <Button type="button" size="sm" onClick={handleCommandPaletteClose}>
                        Close
                      </Button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default CommandPalette;
