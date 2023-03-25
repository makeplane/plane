import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// cmdk
import { Command } from "cmdk";
// hooks
import useTheme from "hooks/use-theme";
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import { ShortcutsModal, ChangeIssueState, ChangeIssuePriority } from "components/command-palette";
import { BulkDeleteIssuesModal } from "components/core";
import { CreateUpdateCycleModal } from "components/cycles";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateModuleModal } from "components/modules";
import { CreateProjectModal } from "components/project";
import { CreateUpdateViewModal } from "components/views";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// services
import authenticationService from "services/authentication.service";
import issuesService from "services/issues.service";
// types
import { IIssue } from "types";
// fetch keys
import { ISSUE_DETAILS } from "constants/fetch-keys";

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

  const { user, mutateUser } = useUser();
  const { setToastAlert } = useToast();
  const { toggleCollapsed } = useTheme();

  const { data: issueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

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

  const logout = async () => {
    await authenticationService
      .signOut()
      .then((response) => {
        console.log("user signed out", response);
      })
      .catch((error) => {
        console.log("Failed to sign out", error);
      })
      .finally(() => {
        mutateUser();
        router.push("/signin");
      });
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
              <Dialog.Panel className="relative mx-auto transform overflow-hidden rounded-lg bg-white text-left shadow-2xl ring-1 ring-black ring-opacity-5 transition-all sm:my-8 sm:w-full sm:max-w-lg">
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
                      <span className="rounded bg-slate-100 p-1 px-2 text-xs font-medium text-slate-500">
                        {issueDetails.project_detail?.identifier}-{issueDetails.sequence_id}{" "}
                        {issueDetails?.name}
                      </span>
                    </div>
                  )}
                  <Command.Input
                    className="w-full rounded-t-lg border-b p-4 text-sm outline-none"
                    placeholder={placeholder}
                    value={search}
                    onValueChange={(e) => {
                      setSearch(e);
                    }}
                    autoFocus
                  />
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
                              Change state...
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Change priority...");
                                setSearch("");
                                setPages([...pages, "change-issue-priority"]);
                              }}
                            >
                              Change priority...
                            </Command.Item>
                            <Command.Item onSelect={deleteIssue}>Delete issue</Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                copyIssueUrlToClipboard();
                              }}
                            >
                              Copy issue URL to clipboard
                            </Command.Item>
                          </>
                        )}
                        <Command.Group heading="Issue">
                          <Command.Item onSelect={createNewIssue}>
                            Create new issue
                            <kbd>C</kbd>
                          </Command.Item>
                        </Command.Group>

                        {workspaceSlug && (
                          <Command.Group heading="Project">
                            <Command.Item onSelect={createNewProject}>
                              Create new project
                              <kbd>P</kbd>
                            </Command.Item>
                          </Command.Group>
                        )}

                        {projectId && (
                          <>
                            <Command.Group heading="Cycle">
                              <Command.Item onSelect={createNewCycle}>
                                Create new cycle
                                <kbd>Q</kbd>
                              </Command.Item>
                            </Command.Group>

                            <Command.Group heading="Module">
                              <Command.Item onSelect={createNewModule}>
                                Create new module
                                <kbd>M</kbd>
                              </Command.Item>
                            </Command.Group>

                            <Command.Group heading="View">
                              <Command.Item onSelect={createNewView}>
                                Create new view
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
                            Search settings...
                          </Command.Item>
                        </Command.Group>
                        <Command.Group heading="Account">
                          <Command.Item onSelect={createNewWorkspace}>
                            Create new workspace
                          </Command.Item>
                          <Command.Item onSelect={logout}>Log out</Command.Item>
                        </Command.Group>
                      </>
                    )}

                    {page === "settings" && workspaceSlug && (
                      <>
                        <Command.Item onSelect={() => goToSettings()}>General</Command.Item>
                        <Command.Item onSelect={() => goToSettings("members")}>
                          Members
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("billing")}>
                          Billings and Plans
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("integrations")}>
                          Integrations
                        </Command.Item>
                        <Command.Item onSelect={() => goToSettings("import-export")}>
                          Import/Export
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
