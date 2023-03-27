import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

// icons
import {
  ChartBarIcon,
  ClipboardIcon,
  FolderPlusIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TrashIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  AssignmentClipboardIcon,
  BoltIcon,
  ContrastIcon,
  DiscordIcon,
  DocumentIcon,
  GithubIcon,
  LayerDiagonalIcon,
  PeopleGroupIcon,
  SettingIcon,
  ViewListIcon,
} from "components/icons";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// cmdk
import { Command } from "cmdk";
// hooks
import useTheme from "hooks/use-theme";
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import {
  ShortcutsModal,
  ChangeIssueState,
  ChangeIssuePriority,
  ChangeIssueAssignee,
} from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CreateUpdateCycleModal } from "components/cycles";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateModuleModal } from "components/modules";
import { CreateProjectModal } from "components/project";
import { CreateUpdateViewModal } from "components/views";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// services
import issuesService from "services/issues.service";
// types
import { IIssue } from "types";
// fetch keys
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

export const CommandPalette: React.FC = () => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [isBulkDeleteIssuesModalOpen, setIsBulkDeleteIssuesModalOpen] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const [search, setSearch] = React.useState<string>("");
  const [placeholder, setPlaceholder] = React.useState("Type a command or search...");
  const [pages, setPages] = React.useState<string[]>([]);
  const page = pages[pages.length - 1];

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();
  const { toggleCollapsed } = useTheme();

  const { data: issueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const updateIssue = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate(
        ISSUE_DETAILS(issueId as string),
        (prevData: IIssue) => ({
          ...prevData,
          ...formData,
        }),
        false
      );

      const payload = { ...formData };
      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then(() => {
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
          mutate(ISSUE_DETAILS(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId]
  );

  const handleIssueAssignees = (assignee: string) => {
    if (!issueDetails) return;

    setIsPaletteOpen(false);
    const updatedAssignees = issueDetails.assignees ?? [];

    if (updatedAssignees.includes(assignee)) {
      updatedAssignees.splice(updatedAssignees.indexOf(assignee), 1);
    } else {
      updatedAssignees.push(assignee);
    }
    updateIssue({ assignees_list: updatedAssignees });
  };

  const copyIssueUrlToClipboard = useCallback(() => {
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
  }, [router, setToastAlert]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target as Element).classList?.contains("remirror-editor")
      ) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setIsPaletteOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          if (e.altKey) {
            e.preventDefault();
            copyIssueUrlToClipboard();
          }
        } else if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          setIsIssueModalOpen(true);
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          setIsProjectModalOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
          e.preventDefault();
          toggleCollapsed();
        } else if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
        } else if (e.key.toLowerCase() === "q") {
          e.preventDefault();
          setIsCreateCycleModalOpen(true);
        } else if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          setIsCreateModuleModalOpen(true);
        } else if (e.key === "Delete") {
          e.preventDefault();
          setIsBulkDeleteIssuesModalOpen(true);
        }
      }
    },
    [toggleCollapsed, copyIssueUrlToClipboard]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!user) return null;

  const createNewWorkspace = () => {
    setIsPaletteOpen(false);
    router.push("/create-workspace");
  };

  const createNewProject = () => {
    setIsPaletteOpen(false);
    setIsProjectModalOpen(true);
  };

  const createNewIssue = () => {
    setIsPaletteOpen(false);
    setIsIssueModalOpen(true);
  };

  const createNewCycle = () => {
    setIsPaletteOpen(false);
    setIsCreateCycleModalOpen(true);
  };

  const createNewView = () => {
    setIsPaletteOpen(false);
    setIsCreateViewModalOpen(true);
  };

  const createNewModule = () => {
    setIsPaletteOpen(false);
    setIsCreateModuleModalOpen(true);
  };

  const deleteIssue = () => {
    setIsPaletteOpen(false);
    setDeleteIssueModal(true);
  };

  const goToSettings = (path: string = "") => {
    setIsPaletteOpen(false);
    router.push(`/${workspaceSlug}/settings/${path}`);
  };

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
            handleClose={() => setIsCreateCycleModalOpen(false)}
          />
          <CreateUpdateModuleModal
            isOpen={isCreateModuleModalOpen}
            setIsOpen={setIsCreateModuleModalOpen}
          />
          <CreateUpdateViewModal
            handleClose={() => setIsCreateViewModalOpen(false)}
            isOpen={isCreateViewModalOpen}
          />
        </>
      )}
      {issueId && issueDetails && (
        <DeleteIssueModal
          handleClose={() => setDeleteIssueModal(false)}
          isOpen={deleteIssueModal}
          data={issueDetails}
        />
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
        afterLeave={() => {
          setSearch("");
        }}
        as={React.Fragment}
      >
        <Dialog as="div" className="relative z-30" onClose={() => setIsPaletteOpen(false)}>
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

          <div className="fixed inset-0 z-30 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                <Command
                  onKeyDown={(e) => {
                    // when seach is empty and page is undefined
                    // when user tries to close the modal with esc
                    if (e.key === "Escape" && !page && !search) {
                      setIsPaletteOpen(false);
                    }
                    // Escape goes to previous page
                    // Backspace goes to previous page when search is empty
                    if (e.key === "Escape" || (e.key === "Backspace" && !search)) {
                      e.preventDefault();
                      setPages((pages) => pages.slice(0, -1));
                      setPlaceholder("Type a command or search...");
                    }
                  }}
                >
                  {issueId && issueDetails && (
                    <div className="p-3">
                      <span className="rounded-md bg-slate-100 p-1 px-2 text-xs font-medium text-slate-500">
                        {issueDetails.project_detail?.identifier}-{issueDetails.sequence_id}{" "}
                        {issueDetails?.name}
                      </span>
                    </div>
                  )}
                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                      aria-hidden="true"
                    />
                    <Command.Input
                      className="w-full border-0 border-b bg-transparent p-4 pl-11 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                      placeholder={placeholder}
                      value={search}
                      onValueChange={(e) => {
                        setSearch(e);
                      }}
                      autoFocus
                    />
                  </div>
                  <Command.List className="max-h-96 overflow-scroll p-2">
                    <Command.Empty className="my-4 text-center text-gray-500">
                      No results found.
                    </Command.Empty>

                    {!page && (
                      <>
                        {issueId && (
                          <>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Change state...");
                                setSearch("");
                                setPages([...pages, "change-issue-state"]);
                              }}
                            >
                              <div className="flex items-center gap-2 text-slate-700">
                                <Squares2X2Icon className="h-4 w-4" />
                                Change state...
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Change priority...");
                                setSearch("");
                                setPages([...pages, "change-issue-priority"]);
                              }}
                            >
                              <div className="flex items-center gap-2 text-slate-700">
                                <ChartBarIcon className="h-4 w-4" />
                                Change priority...
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Assign to...");
                                setSearch("");
                                setPages([...pages, "change-issue-assignee"]);
                              }}
                            >
                              <div className="flex items-center gap-2 text-slate-700">
                                <UsersIcon className="h-4 w-4" />
                                Assign to...
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                handleIssueAssignees(user.id);
                                setSearch("");
                              }}
                            >
                              <div className="flex items-center gap-2 text-slate-700">
                                {issueDetails?.assignees.includes(user.id) ? (
                                  <>
                                    <UserMinusIcon className="h-4 w-4" />
                                    Un-assign from me
                                  </>
                                ) : (
                                  <>
                                    <UserPlusIcon className="h-4 w-4" />
                                    Assign to me
                                  </>
                                )}
                              </div>
                            </Command.Item>

                            <Command.Item onSelect={deleteIssue}>
                              <div className="flex items-center gap-2 text-slate-700">
                                <TrashIcon className="h-4 w-4" />
                                Delete issue
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                copyIssueUrlToClipboard();
                              }}
                            >
                              <div className="flex items-center gap-2 text-slate-700">
                                <ClipboardIcon className="h-4 w-4" />
                                Copy issue URL to clipboard
                              </div>
                            </Command.Item>
                          </>
                        )}
                        <Command.Group heading="Issue">
                          <Command.Item onSelect={createNewIssue}>
                            <div className="flex items-center gap-2 text-slate-700">
                              <LayerDiagonalIcon className="h-4 w-4" />
                              Create new issue
                            </div>
                            <kbd>C</kbd>
                          </Command.Item>
                        </Command.Group>

                        {workspaceSlug && (
                          <Command.Group heading="Project">
                            <Command.Item onSelect={createNewProject}>
                              <div className="flex items-center gap-2 text-slate-700">
                                <AssignmentClipboardIcon className="h-4 w-4" />
                                Create new project
                              </div>
                              <kbd>P</kbd>
                            </Command.Item>
                          </Command.Group>
                        )}

                        {projectId && (
                          <>
                            <Command.Group heading="Cycle">
                              <Command.Item onSelect={createNewCycle}>
                                <div className="flex items-center gap-2 text-slate-700">
                                  <ContrastIcon className="h-4 w-4" />
                                  Create new cycle
                                </div>
                                <kbd>Q</kbd>
                              </Command.Item>
                            </Command.Group>

                            <Command.Group heading="Module">
                              <Command.Item onSelect={createNewModule}>
                                <div className="flex items-center gap-2 text-slate-700">
                                  <PeopleGroupIcon className="h-4 w-4" />
                                  Create new module
                                </div>
                                <kbd>M</kbd>
                              </Command.Item>
                            </Command.Group>

                            <Command.Group heading="View">
                              <Command.Item onSelect={createNewView}>
                                <div className="flex items-center gap-2 text-slate-700">
                                  <ViewListIcon className="h-4 w-4" />
                                  Create new view
                                </div>
                                <kbd>Q</kbd>
                              </Command.Item>
                            </Command.Group>
                          </>
                        )}

                        <Command.Group heading="Workspace Settings">
                          <Command.Item
                            onSelect={() => {
                              setPlaceholder("Search workspace settings...");
                              setSearch("");
                              setPages([...pages, "settings"]);
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-700">
                              <SettingIcon className="h-4 w-4" />
                              Search settings...
                            </div>
                          </Command.Item>
                        </Command.Group>
                        <Command.Group heading="Account">
                          <Command.Item onSelect={createNewWorkspace}>
                            <div className="flex items-center gap-2 text-slate-700">
                              <FolderPlusIcon className="h-4 w-4" />
                              Create new workspace
                            </div>
                          </Command.Item>
                        </Command.Group>
                        <Command.Group heading="Help">
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              const e = new KeyboardEvent("keydown", {
                                key: "h",
                              });
                              document.dispatchEvent(e);
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-700">
                              <BoltIcon className="h-4 w-4" />
                              Open keyboard shortcuts
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              window.open("https://docs.plane.so/", "_blank");
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-700">
                              <DocumentIcon className="h-4 w-4" />
                              Open Plane documentation
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              window.open("https://discord.com/invite/A92xrEGCge", "_blank");
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-600">
                              <DiscordIcon className="h-4 w-4" />
                              Join our discord
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              window.open(
                                "https://github.com/makeplane/plane/issues/new/choose",
                                "_blank"
                              );
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-700">
                              <GithubIcon className="h-4 w-4" />
                              Report a bug
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              window.open("mailto:hello@plane.so", "_blank");
                            }}
                          >
                            <div className="flex items-center gap-2 text-slate-700">
                              <InboxIcon className="h-4 w-4" />
                              Email us
                            </div>
                          </Command.Item>
                        </Command.Group>
                      </>
                    )}

                    {page === "settings" && workspaceSlug && (
                      <>
                        <Command.Item onSelect={() => goToSettings()}>
                          <div className="flex items-center gap-2 text-slate-700">
                            <SettingIcon className="h-4 w-4" />
                            General
                          </div>
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("members")}>
                          <div className="flex items-center gap-2 text-slate-700">
                            <SettingIcon className="h-4 w-4" />
                            Members
                          </div>
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("billing")}>
                          <div className="flex items-center gap-2 text-slate-700">
                            <SettingIcon className="h-4 w-4" />
                            Billings and Plans
                          </div>
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("integrations")}>
                          <div className="flex items-center gap-2 text-slate-700">
                            <SettingIcon className="h-4 w-4" />
                            Integrations
                          </div>
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("import-export")}>
                          <div className="flex items-center gap-2 text-slate-700">
                            <SettingIcon className="h-4 w-4" />
                            Import/Export
                          </div>
                        </Command.Item>
                      </>
                    )}
                    {page === "change-issue-state" && issueDetails && (
                      <>
                        <ChangeIssueState
                          issue={issueDetails}
                          setIsPaletteOpen={setIsPaletteOpen}
                        />
                      </>
                    )}
                    {page === "change-issue-priority" && issueDetails && (
                      <ChangeIssuePriority
                        issue={issueDetails}
                        setIsPaletteOpen={setIsPaletteOpen}
                      />
                    )}
                    {page === "change-issue-assignee" && issueDetails && (
                      <ChangeIssueAssignee
                        issue={issueDetails}
                        setIsPaletteOpen={setIsPaletteOpen}
                      />
                    )}
                  </Command.List>
                </Command>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
