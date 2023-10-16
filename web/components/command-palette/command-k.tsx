import React, { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// cmdk
import { Command } from "cmdk";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { WorkspaceService } from "services/workspace.service";
import { IssueService } from "services/issue";
import { InboxService } from "services/inbox.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
import useDebounce from "hooks/use-debounce";
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// components
import {
  ChangeInterfaceTheme,
  ChangeIssueAssignee,
  ChangeIssuePriority,
  ChangeIssueState,
  commandGroups,
} from "components/command-palette";
// ui
import { Icon } from "components/ui";
import { Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// icons
import { DiscordIcon, GithubIcon, SettingIcon } from "components/icons";
import { InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue, IWorkspaceSearchResults } from "types";
// fetch-keys
import { INBOX_LIST, ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

type Props = {
  deleteIssue: () => void;
  isPaletteOpen: boolean;
  setIsPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

// services
const workspaceService = new WorkspaceService();
const issueService = new IssueService();
const inboxService = new InboxService();

export const CommandK: React.FC<Props> = ({ deleteIssue, isPaletteOpen, setIsPaletteOpen }) => {
  const [placeholder, setPlaceholder] = useState("Type a command or search...");

  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IWorkspaceSearchResults>({
    results: {
      workspace: [],
      project: [],
      issue: [],
      cycle: [],
      module: [],
      issue_view: [],
      page: [],
    },
  });
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);

  const [pages, setPages] = useState<string[]>([]);
  const page = pages[pages.length - 1];

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: inboxList } = useSWR(
    workspaceSlug && projectId ? INBOX_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => inboxService.getInboxes(workspaceSlug as string, projectId as string) : null
  );

  const updateIssue = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId) return;

      mutate<IIssue>(
        ISSUE_DETAILS(issueId as string),

        (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload = { ...formData };
      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload, user)
        .then(() => {
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
          mutate(ISSUE_DETAILS(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, user]
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

  const redirect = (path: string) => {
    setIsPaletteOpen(false);
    router.push(path);
  };

  const createNewWorkspace = () => {
    setIsPaletteOpen(false);
    router.push("/create-workspace");
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

  useEffect(
    () => {
      if (!workspaceSlug) return;

      setIsLoading(true);

      if (debouncedSearchTerm) {
        setIsSearching(true);
        workspaceService
          .searchWorkspace(workspaceSlug as string, {
            ...(projectId ? { project_id: projectId.toString() } : {}),
            search: debouncedSearchTerm,
            workspace_search: !projectId ? true : isWorkspaceLevel,
          })
          .then((results) => {
            setResults(results);
            const count = Object.keys(results.results).reduce(
              (accumulator, key) => (results.results as any)[key].length + accumulator,
              0
            );
            setResultsCount(count);
          })
          .finally(() => {
            setIsLoading(false);
            setIsSearching(false);
          });
      } else {
        setResults({
          results: {
            workspace: [],
            project: [],
            issue: [],
            cycle: [],
            module: [],
            issue_view: [],
            page: [],
          },
        });
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug] // Only call effect if debounced search term changes
  );

  if (!user) return null;

  return (
    <Transition.Root
      show={isPaletteOpen}
      afterLeave={() => {
        setSearchTerm("");
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
            <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-custom-border-200 divide-opacity-10 rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-2xl transition-all">
              <Command
                filter={(value, search) => {
                  if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                  return 0;
                }}
                onKeyDown={(e) => {
                  // when search is empty and page is undefined
                  // when user tries to close the modal with esc
                  if (e.key === "Escape" && !page && !searchTerm) {
                    setIsPaletteOpen(false);
                  }
                  // Escape goes to previous page
                  // Backspace goes to previous page when search is empty
                  if (e.key === "Escape" || (e.key === "Backspace" && !searchTerm)) {
                    e.preventDefault();
                    setPages((pages) => pages.slice(0, -1));
                    setPlaceholder("Type a command or search...");
                  }
                }}
              >
                <div
                  className={`flex sm:items-center gap-4 p-3 pb-0 ${
                    issueDetails ? "flex-col sm:flex-row justify-between" : "justify-end"
                  }`}
                >
                  {issueDetails && (
                    <div className="overflow-hidden truncate rounded-md bg-custom-background-80 p-2 text-xs font-medium text-custom-text-200">
                      {issueDetails.project_detail.identifier}-{issueDetails.sequence_id} {issueDetails.name}
                    </div>
                  )}
                  {projectId && (
                    <Tooltip tooltipContent="Toggle workspace level search">
                      <div className="flex-shrink-0 self-end sm:self-center flex items-center gap-1 text-xs cursor-pointer">
                        <button
                          type="button"
                          onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                          className="flex-shrink-0"
                        >
                          Workspace Level
                        </button>
                        <ToggleSwitch
                          value={isWorkspaceLevel}
                          onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
                        />
                      </div>
                    </Tooltip>
                  )}
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-custom-text-200"
                    aria-hidden="true"
                  />
                  <Command.Input
                    className="w-full border-0 border-b border-custom-border-200 bg-transparent p-4 pl-11 text-custom-text-100 placeholder:text-custom-text-400 outline-none focus:ring-0 text-sm"
                    placeholder={placeholder}
                    value={searchTerm}
                    onValueChange={(e) => {
                      setSearchTerm(e);
                    }}
                    autoFocus
                    tabIndex={1}
                  />
                </div>

                <Command.List className="max-h-96 overflow-scroll p-2">
                  {searchTerm !== "" && (
                    <h5 className="text-xs text-custom-text-100 mx-[3px] my-4">
                      Search results for{" "}
                      <span className="font-medium">
                        {'"'}
                        {searchTerm}
                        {'"'}
                      </span>{" "}
                      in {!projectId || isWorkspaceLevel ? "workspace" : "project"}:
                    </h5>
                  )}

                  {!isLoading && resultsCount === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
                    <div className="my-4 text-center text-custom-text-200">No results found.</div>
                  )}

                  {(isLoading || isSearching) && (
                    <Command.Loading>
                      <Loader className="space-y-3">
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                        <Loader.Item height="40px" />
                      </Loader>
                    </Command.Loading>
                  )}

                  {debouncedSearchTerm !== "" &&
                    Object.keys(results.results).map((key) => {
                      const section = (results.results as any)[key];
                      const currentSection = commandGroups[key];

                      if (section.length > 0) {
                        return (
                          <Command.Group key={key} heading={currentSection.title}>
                            {section.map((item: any) => (
                              <Command.Item
                                key={item.id}
                                onSelect={() => {
                                  setIsPaletteOpen(false);
                                  router.push(currentSection.path(item));
                                }}
                                value={`${key}-${item?.name}`}
                                className="focus:outline-none"
                              >
                                <div className="flex items-center gap-2 overflow-hidden text-custom-text-200">
                                  <Icon iconName={currentSection.icon} />
                                  <p className="block flex-1 truncate">{currentSection.itemName(item)}</p>
                                </div>
                              </Command.Item>
                            ))}
                          </Command.Group>
                        );
                      }
                    })}

                  {!page && (
                    <>
                      {issueId && (
                        <Command.Group heading="Issue actions">
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              setPlaceholder("Change state...");
                              setSearchTerm("");
                              setPages([...pages, "change-issue-state"]);
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="grid_view" />
                              Change state...
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setPlaceholder("Change priority...");
                              setSearchTerm("");
                              setPages([...pages, "change-issue-priority"]);
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="bar_chart" />
                              Change priority...
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setPlaceholder("Assign to...");
                              setSearchTerm("");
                              setPages([...pages, "change-issue-assignee"]);
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="group" />
                              Assign to...
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              handleIssueAssignees(user.id);
                              setSearchTerm("");
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              {issueDetails?.assignees.includes(user.id) ? (
                                <>
                                  <Icon iconName="person_remove" />
                                  Un-assign from me
                                </>
                              ) : (
                                <>
                                  <Icon iconName="person_add" />
                                  Assign to me
                                </>
                              )}
                            </div>
                          </Command.Item>
                          <Command.Item onSelect={deleteIssue} className="focus:outline-none">
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="delete" />
                              Delete issue
                            </div>
                          </Command.Item>
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              copyIssueUrlToClipboard();
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="link" />
                              Copy issue URL
                            </div>
                          </Command.Item>
                        </Command.Group>
                      )}
                      <Command.Group heading="Issue">
                        <Command.Item
                          onSelect={() => {
                            setIsPaletteOpen(false);
                            const e = new KeyboardEvent("keydown", {
                              key: "c",
                            });
                            document.dispatchEvent(e);
                          }}
                          className="focus:bg-custom-background-80"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="stack" />
                            Create new issue
                          </div>
                          <kbd>C</kbd>
                        </Command.Item>
                      </Command.Group>

                      {workspaceSlug && (
                        <Command.Group heading="Project">
                          <Command.Item
                            onSelect={() => {
                              setIsPaletteOpen(false);
                              const e = new KeyboardEvent("keydown", {
                                key: "p",
                              });
                              document.dispatchEvent(e);
                            }}
                            className="focus:outline-none"
                          >
                            <div className="flex items-center gap-2 text-custom-text-200">
                              <Icon iconName="create_new_folder" />
                              Create new project
                            </div>
                            <kbd>P</kbd>
                          </Command.Item>
                        </Command.Group>
                      )}

                      {projectId && (
                        <>
                          <Command.Group heading="Cycle">
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                const e = new KeyboardEvent("keydown", {
                                  key: "q",
                                });
                                document.dispatchEvent(e);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Icon iconName="contrast" />
                                Create new cycle
                              </div>
                              <kbd>Q</kbd>
                            </Command.Item>
                          </Command.Group>
                          <Command.Group heading="Module">
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                const e = new KeyboardEvent("keydown", {
                                  key: "m",
                                });
                                document.dispatchEvent(e);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Icon iconName="dataset" />
                                Create new module
                              </div>
                              <kbd>M</kbd>
                            </Command.Item>
                          </Command.Group>
                          <Command.Group heading="View">
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                const e = new KeyboardEvent("keydown", {
                                  key: "v",
                                });
                                document.dispatchEvent(e);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Icon iconName="photo_filter" />
                                Create new view
                              </div>
                              <kbd>V</kbd>
                            </Command.Item>
                          </Command.Group>
                          <Command.Group heading="Page">
                            <Command.Item
                              onSelect={() => {
                                setIsPaletteOpen(false);
                                const e = new KeyboardEvent("keydown", {
                                  key: "d",
                                });
                                document.dispatchEvent(e);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Icon iconName="article" />
                                Create new page
                              </div>
                              <kbd>D</kbd>
                            </Command.Item>
                          </Command.Group>
                          {projectDetails && projectDetails.inbox_view && (
                            <Command.Group heading="Inbox">
                              <Command.Item
                                onSelect={() => {
                                  setIsPaletteOpen(false);
                                  redirect(`/${workspaceSlug}/projects/${projectId}/inbox/${inboxList?.[0]?.id}`);
                                }}
                                className="focus:outline-none"
                              >
                                <div className="flex items-center gap-2 text-custom-text-200">
                                  <InboxIcon className="h-4 w-4" color="#6b7280" />
                                  Open inbox
                                </div>
                              </Command.Item>
                            </Command.Group>
                          )}
                        </>
                      )}

                      <Command.Group heading="Workspace Settings">
                        <Command.Item
                          onSelect={() => {
                            setPlaceholder("Search workspace settings...");
                            setSearchTerm("");
                            setPages([...pages, "settings"]);
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="settings" />
                            Search settings...
                          </div>
                        </Command.Item>
                      </Command.Group>
                      <Command.Group heading="Account">
                        <Command.Item onSelect={createNewWorkspace} className="focus:outline-none">
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="create_new_folder" />
                            Create new workspace
                          </div>
                        </Command.Item>
                        <Command.Item
                          onSelect={() => {
                            setPlaceholder("Change interface theme...");
                            setSearchTerm("");
                            setPages([...pages, "change-interface-theme"]);
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="settings" />
                            Change interface theme...
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
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="rocket_launch" />
                            Open keyboard shortcuts
                          </div>
                        </Command.Item>
                        <Command.Item
                          onSelect={() => {
                            setIsPaletteOpen(false);
                            window.open("https://docs.plane.so/", "_blank");
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="article" />
                            Open Plane documentation
                          </div>
                        </Command.Item>
                        <Command.Item
                          onSelect={() => {
                            setIsPaletteOpen(false);
                            window.open("https://discord.com/invite/A92xrEGCge", "_blank");
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <DiscordIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
                            Join our Discord
                          </div>
                        </Command.Item>
                        <Command.Item
                          onSelect={() => {
                            setIsPaletteOpen(false);
                            window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank");
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <GithubIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
                            Report a bug
                          </div>
                        </Command.Item>
                        <Command.Item
                          onSelect={() => {
                            setIsPaletteOpen(false);
                            (window as any).$crisp.push(["do", "chat:open"]);
                          }}
                          className="focus:outline-none"
                        >
                          <div className="flex items-center gap-2 text-custom-text-200">
                            <Icon iconName="sms" />
                            Chat with us
                          </div>
                        </Command.Item>
                      </Command.Group>
                    </>
                  )}

                  {page === "settings" && workspaceSlug && (
                    <>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          General
                        </div>
                      </Command.Item>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings/members`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          Members
                        </div>
                      </Command.Item>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings/billing`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          Billing and Plans
                        </div>
                      </Command.Item>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings/integrations`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          Integrations
                        </div>
                      </Command.Item>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings/imports`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          Import
                        </div>
                      </Command.Item>
                      <Command.Item
                        onSelect={() => redirect(`/${workspaceSlug}/settings/exports`)}
                        className="focus:outline-none"
                      >
                        <div className="flex items-center gap-2 text-custom-text-200">
                          <SettingIcon className="h-4 w-4 text-custom-text-200" />
                          Export
                        </div>
                      </Command.Item>
                    </>
                  )}
                  {page === "change-issue-state" && issueDetails && (
                    <ChangeIssueState issue={issueDetails} setIsPaletteOpen={setIsPaletteOpen} user={user} />
                  )}
                  {page === "change-issue-priority" && issueDetails && (
                    <ChangeIssuePriority issue={issueDetails} setIsPaletteOpen={setIsPaletteOpen} user={user} />
                  )}
                  {page === "change-issue-assignee" && issueDetails && (
                    <ChangeIssueAssignee issue={issueDetails} setIsPaletteOpen={setIsPaletteOpen} user={user} />
                  )}
                  {page === "change-interface-theme" && <ChangeInterfaceTheme setIsPaletteOpen={setIsPaletteOpen} />}
                </Command.List>
              </Command>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
