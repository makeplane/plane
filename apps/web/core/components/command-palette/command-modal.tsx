"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { CommandIcon, FolderPlus, Search, Settings, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import {
  EUserPermissions,
  EUserPermissionsLevel,
  PROJECT_TRACKER_ELEMENTS,
  WORK_ITEM_TRACKER_ELEMENTS,
  WORKSPACE_DEFAULT_SEARCH_RESULT,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LayersIcon } from "@plane/propel/icons";
import {
  IWorkspaceSearchResults,
  ICycle,
  TActivityEntityData,
  TIssueEntityData,
  TIssueSearchResponse,
  TPartialProject,
} from "@plane/types";
import { Loader, ToggleSwitch } from "@plane/ui";
import { cn, getTabIndex, generateWorkItemLink } from "@plane/utils";
// components
import {
  ChangeIssueAssignee,
  ChangeIssuePriority,
  ChangeIssueState,
  CommandPaletteHelpActions,
  CommandPaletteIssueActions,
  CommandPaletteProjectActions,
  CommandPaletteSearchResults,
  CommandPaletteThemeActions,
  CommandPaletteWorkspaceSettingsActions,
} from "@/components/command-palette";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import {
  CommandPaletteProjectSelector,
  CommandPaletteCycleSelector,
  CommandPaletteEntityList,
  useKeySequence,
} from "@/components/command-palette";
import { COMMAND_CONFIG } from "@/components/command-palette";
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useCycle } from "@/hooks/store/use-cycle";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
import type { CommandPaletteEntity } from "@/store/base-command-palette.store";

const workspaceService = new WorkspaceService();

export const CommandModal: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId: routerProjectId, workItem } = useParams();
  // states
  const [placeholder, setPlaceholder] = useState("Type a command or search...");
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [searchInIssue, setSearchInIssue] = useState(false);
  const [recentIssues, setRecentIssues] = useState<TIssueEntityData[]>([]);
  const [issueResults, setIssueResults] = useState<TIssueSearchResponse[]>([]);
  const [projectSelectionAction, setProjectSelectionAction] = useState<"navigate" | "cycle" | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const {
    issue: { getIssueById },
    fetchIssueWithIdentifier,
  } = useIssueDetail();
  const { workspaceProjectIds, joinedProjectIds, getPartialProjectById } = useProject();
  const { getProjectCycleIds, getCycleById, fetchAllCycles } = useCycle();
  const { platform, isMobile } = usePlatformOS();
  const { canPerformAnyCreateAction } = useUser();
  const {
    isCommandPaletteOpen,
    toggleCommandPaletteModal,
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    activeEntity,
    clearActiveEntity,
  } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const projectIdentifier = workItem?.toString().split("-")[0];
  const sequence_id = workItem?.toString().split("-")[1];
  // fetch work item details using identifier
  const { data: workItemDetailsSWR } = useSWR(
    workspaceSlug && workItem ? `ISSUE_DETAIL_${workspaceSlug}_${projectIdentifier}_${sequence_id}` : null,
    workspaceSlug && workItem
      ? () => fetchIssueWithIdentifier(workspaceSlug.toString(), projectIdentifier, sequence_id)
      : null
  );

  // derived values
  const issueDetails = workItemDetailsSWR ? getIssueById(workItemDetailsSWR?.id) : null;
  const issueId = issueDetails?.id;
  const projectId = issueDetails?.project_id ?? routerProjectId;
  const page = pages[pages.length - 1];
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  const canPerformWorkspaceActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });

  const openProjectSelection = useCallback(
    (action: "navigate" | "cycle") => {
      if (!workspaceSlug) return;
      setPlaceholder("Search projects...");
      setSearchTerm("");
      setProjectSelectionAction(action);
      setSelectedProjectId(null);
      setPages((p) => [...p, "open-project"]);
    },
    [workspaceSlug]
  );

  const openProjectList = useCallback(() => openProjectSelection("navigate"), [openProjectSelection]);

  const openCycleList = useCallback(() => {
    if (!workspaceSlug) return;
    const currentProject = projectId ? getPartialProjectById(projectId.toString()) : null;
    if (currentProject && currentProject.cycle_view) {
      setSelectedProjectId(projectId.toString());
      setPlaceholder("Search cycles...");
      setSearchTerm("");
      setPages((p) => [...p, "open-cycle"]);
      fetchAllCycles(workspaceSlug.toString(), projectId.toString());
    } else {
      openProjectSelection("cycle");
    }
  }, [workspaceSlug, projectId, getPartialProjectById, fetchAllCycles, openProjectSelection]);

  const openIssueList = useCallback(() => {
    if (!workspaceSlug) return;
    setPlaceholder("Search issues...");
    setSearchTerm("");
    setPages((p) => [...p, "open-issue"]);
    workspaceService
      .fetchWorkspaceRecents(workspaceSlug.toString(), "issue")
      .then((res) =>
        setRecentIssues(res.map((r: TActivityEntityData) => r.entity_data as TIssueEntityData).slice(0, 10))
      )
      .catch(() => setRecentIssues([]));
  }, [workspaceSlug]);

  const entityHandlers = useMemo<
    Partial<Record<CommandPaletteEntity, () => void>>
  >(
    () => ({
      project: openProjectList,
      cycle: openCycleList,
      issue: openIssueList,
    }),
    [openProjectList, openCycleList, openIssueList]
  );

  const sequenceHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    COMMAND_CONFIG.forEach((cmd) => {
      if (!cmd.enabled || cmd.enabled()) {
        const handler = entityHandlers[cmd.entity];
        if (handler) handlers[cmd.sequence] = handler;
      }
    });
    return handlers;
  }, [entityHandlers]);

  const handleKeySequence = useKeySequence(sequenceHandlers);

  useEffect(() => {
    if (!isCommandPaletteOpen || !activeEntity) return;

    const handler = entityHandlers[activeEntity];
    if (handler) handler();
    clearActiveEntity();
  }, [isCommandPaletteOpen, activeEntity, clearActiveEntity, entityHandlers]);

  const projectOptions = useMemo(() => {
    const list: TPartialProject[] = [];
    joinedProjectIds.forEach((id) => {
      const project = getPartialProjectById(id);
      if (project) list.push(project);
    });
    return list.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  }, [joinedProjectIds, getPartialProjectById]);

  const cycleOptions = useMemo(() => {
    const cycles: ICycle[] = [];
    if (selectedProjectId) {
      const cycleIds = getProjectCycleIds(selectedProjectId) || [];
      cycleIds.forEach((cid) => {
        const cycle = getCycleById(cid);
        const status = cycle?.status ? cycle.status.toLowerCase() : "";
        if (cycle && ["current", "upcoming"].includes(status)) cycles.push(cycle);
      });
    }
    return cycles.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  }, [selectedProjectId, getProjectCycleIds, getCycleById]);

  useEffect(() => {
    if (page !== "open-cycle" || !workspaceSlug || !selectedProjectId) return;
    fetchAllCycles(workspaceSlug.toString(), selectedProjectId);
  }, [page, workspaceSlug, selectedProjectId, fetchAllCycles]);

  useEffect(() => {
    if (issueDetails && isCommandPaletteOpen) {
      setSearchInIssue(true);
    }
  }, [issueDetails, isCommandPaletteOpen]);

  useEffect(() => {
    if (!projectId && !isWorkspaceLevel) {
      setIsWorkspaceLevel(true);
    } else {
      setIsWorkspaceLevel(false);
    }
  }, [projectId]);

  const closePalette = () => {
    toggleCommandPaletteModal(false);
    setPages([]);
    setPlaceholder("Type a command or search...");
    setProjectSelectionAction(null);
    setSelectedProjectId(null);
  };

  const createNewWorkspace = () => {
    closePalette();
    router.push("/create-workspace");
  };

  useEffect(() => {
    if (!workspaceSlug) return;

    setIsLoading(true);

    if (debouncedSearchTerm) {
      setIsSearching(true);
      if (page === "open-issue") {
        workspaceService
          .searchEntity(workspaceSlug.toString(), {
            count: 10,
            query: debouncedSearchTerm,
            query_type: ["issue"],
            ...(!isWorkspaceLevel && projectId ? { project_id: projectId.toString() } : {}),
          })
          .then((res) => {
            setIssueResults(res.issue || []);
            setResultsCount(res.issue?.length || 0);
          })
          .finally(() => {
            setIsLoading(false);
            setIsSearching(false);
          });
      } else {
        workspaceService
          .searchWorkspace(workspaceSlug.toString(), {
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
      }
    } else {
      setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
      setIssueResults([]);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, page]);

  return (
    <Transition.Root show={isCommandPaletteOpen} afterLeave={() => setSearchTerm("")} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-30"
        onClose={() => {
          closePalette();
          if (searchInIssue) {
            setSearchInIssue(true);
          }
        }}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className="flex items-center justify-center p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-2xl transform flex-col items-center justify-center divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <div className="w-full max-w-2xl">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                    shouldFilter={searchTerm.length > 0}
                    onKeyDown={(e: any) => {
                      const key = e.key.toLowerCase();
                      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !page && searchTerm === "") {
                        handleKeySequence(e);
                      }
                      if ((e.metaKey || e.ctrlKey) && key === "k") {
                        e.preventDefault();
                        e.stopPropagation();
                        closePalette();
                        return;
                      }

                      if (e.key === "Tab") {
                        e.preventDefault();
                        const commandList = document.querySelector("[cmdk-list]");
                        const items = commandList?.querySelectorAll("[cmdk-item]") || [];
                        const selectedItem = commandList?.querySelector('[aria-selected="true"]');
                        if (items.length === 0) return;

                        const currentIndex = Array.from(items).indexOf(selectedItem as Element);
                        let nextIndex;

                        if (e.shiftKey) {
                          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                        } else {
                          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                        }

                        const nextItem = items[nextIndex] as HTMLElement;
                        if (nextItem) {
                          nextItem.setAttribute("aria-selected", "true");
                          selectedItem?.setAttribute("aria-selected", "false");
                          nextItem.focus();
                          nextItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }
                      }

                      if (e.key === "Escape") {
                        e.preventDefault();
                        if (searchTerm) setSearchTerm("");
                        else closePalette();
                        return;
                      }

                      if (e.key === "Backspace" && !searchTerm && page) {
                        e.preventDefault();
                        const newPages = pages.slice(0, -1);
                        const newPage = newPages[newPages.length - 1];
                        setPages(newPages);
                        if (!newPage) setPlaceholder("Type a command or search...");
                        else if (newPage === "open-project") setPlaceholder("Search projects...");
                        else if (newPage === "open-cycle") setPlaceholder("Search cycles...");
                        if (page === "open-cycle") setSelectedProjectId(null);
                        if (page === "open-project" && !newPage) setProjectSelectionAction(null);
                      }
                    }}
                  >
                    <div className="relative flex items-center px-4 border-0 border-b border-custom-border-200">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Search
                          className="h-4 w-4 text-custom-text-200 flex-shrink-0"
                          aria-hidden="true"
                          strokeWidth={2}
                        />
                        {searchInIssue && issueDetails && (
                          <>
                            <span className="flex items-center text-sm">Update in:</span>
                            <span className="flex items-center gap-1 rounded px-1.5 py-1 text-sm bg-custom-primary-100/10 ">
                              {issueDetails.project_id && (
                                <IssueIdentifier
                                  issueId={issueDetails.id}
                                  projectId={issueDetails.project_id}
                                  textContainerClassName="text-sm text-custom-primary-200"
                                />
                              )}
                              <X
                                size={12}
                                strokeWidth={2}
                                className="flex-shrink-0 cursor-pointer"
                                onClick={() => {
                                  setSearchInIssue(false);
                                }}
                              />
                            </span>
                          </>
                        )}
                      </div>
                      <Command.Input
                        className={cn(
                          "w-full bg-transparent p-4 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                        )}
                        placeholder={placeholder}
                        value={searchTerm}
                        onValueChange={(e) => setSearchTerm(e)}
                        autoFocus
                        tabIndex={baseTabIndex}
                      />
                    </div>

                    <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
                      {searchTerm !== "" && (
                        <h5 className="mx-[3px] my-4 text-xs text-custom-text-100">
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
                        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
                          <SimpleEmptyState title={t("command_k.empty_state.search.title")} assetPath={resolvedPath} />
                        </div>
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

                      {debouncedSearchTerm !== "" && page !== "open-issue" && (
                        <CommandPaletteSearchResults closePalette={closePalette} results={results} />
                      )}

                      {!page && (
                        <>
                          {/* issue actions */}
                          {issueId && issueDetails && searchInIssue && (
                            <CommandPaletteIssueActions
                              closePalette={closePalette}
                              issueDetails={issueDetails}
                              pages={pages}
                              setPages={(newPages) => setPages(newPages)}
                              setPlaceholder={(newPlaceholder) => setPlaceholder(newPlaceholder)}
                              setSearchTerm={(newSearchTerm) => setSearchTerm(newSearchTerm)}
                            />
                          )}
                          {workspaceSlug && joinedProjectIds.length > 0 && (
                            <Command.Group heading="Navigate">
                              {COMMAND_CONFIG.filter((cmd) => !cmd.enabled || cmd.enabled()).map((cmd) => (
                                <Command.Item
                                  key={cmd.id}
                                  onSelect={() => entityHandlers[cmd.entity]?.()}
                                  className="focus:outline-none"
                                >
                                  <div className="flex items-center gap-2 text-custom-text-200">
                                    <Search className="h-3.5 w-3.5" />
                                    {cmd.title}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {cmd.keys.map((k) => (
                                      <kbd key={k}>{k}</kbd>
                                    ))}
                                  </div>
                                </Command.Item>
                              ))}
                            </Command.Group>
                          )}
                          {workspaceSlug &&
                            workspaceProjectIds &&
                            workspaceProjectIds.length > 0 &&
                            canPerformAnyCreateAction && (
                              <Command.Group heading="Work item">
                                <Command.Item
                                  onSelect={() => {
                                    closePalette();
                                    captureClick({
                                      elementName: WORK_ITEM_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_BUTTON,
                                    });
                                    toggleCreateIssueModal(true);
                                  }}
                                  className="focus:bg-custom-background-80"
                                >
                                  <div className="flex items-center gap-2 text-custom-text-200">
                                    <LayersIcon className="h-3.5 w-3.5" />
                                    Create new work item
                                  </div>
                                  <kbd>C</kbd>
                                </Command.Item>
                              </Command.Group>
                            )}
                          {workspaceSlug && canPerformWorkspaceActions && (
                            <Command.Group heading="Project">
                              <Command.Item
                                onSelect={() => {
                                  closePalette();
                                  captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.COMMAND_PALETTE_CREATE_BUTTON });
                                  toggleCreateProjectModal(true);
                                }}
                                className="focus:outline-none"
                              >
                                <div className="flex items-center gap-2 text-custom-text-200">
                                  <FolderPlus className="h-3.5 w-3.5" />
                                  Create new project
                                </div>
                                <kbd>P</kbd>
                              </Command.Item>
                            </Command.Group>
                          )}

                          {/* project actions */}
                          {projectId && canPerformAnyCreateAction && (
                            <CommandPaletteProjectActions closePalette={closePalette} />
                          )}
                          {canPerformWorkspaceActions && (
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
                                  <Settings className="h-3.5 w-3.5" />
                                  Search settings...
                                </div>
                              </Command.Item>
                            </Command.Group>
                          )}
                          <Command.Group heading="Account">
                            <Command.Item onSelect={createNewWorkspace} className="focus:outline-none">
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <FolderPlus className="h-3.5 w-3.5" />
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
                                <Settings className="h-3.5 w-3.5" />
                                Change interface theme...
                              </div>
                            </Command.Item>
                          </Command.Group>

                          {/* help options */}
                          <CommandPaletteHelpActions closePalette={closePalette} />
                        </>
                      )}

                      {page === "open-project" && workspaceSlug && (
                        <CommandPaletteProjectSelector
                          projects={projectOptions.filter((p) =>
                            projectSelectionAction === "cycle" ? p.cycle_view : true
                          )}
                          onSelect={(project) => {
                            if (projectSelectionAction === "navigate") {
                              closePalette();
                              router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
                            } else if (projectSelectionAction === "cycle") {
                              setSelectedProjectId(project.id);
                              setPages((p) => [...p, "open-cycle"]);
                              setPlaceholder("Search cycles...");
                              fetchAllCycles(workspaceSlug.toString(), project.id);
                            }
                          }}
                        />
                      )}

                      {page === "open-cycle" && workspaceSlug && selectedProjectId && (
                        <CommandPaletteCycleSelector
                          cycles={cycleOptions}
                          onSelect={(cycle) => {
                            closePalette();
                            router.push(`/${workspaceSlug}/projects/${cycle.project_id}/cycles/${cycle.id}`);
                          }}
                        />
                      )}

                      {page === "open-issue" && workspaceSlug && (
                        <>
                          {searchTerm === "" ? (
                            recentIssues.length > 0 ? (
                              <CommandPaletteEntityList
                                heading="Issues"
                                items={recentIssues}
                                getKey={(issue) => issue.id}
                                getLabel={(issue) => `${issue.project_identifier}-${issue.sequence_id} ${issue.name}`}
                                renderItem={(issue) => (
                                  <div className="flex items-center gap-2">
                                    <IssueIdentifier
                                      projectId={issue.project_id}
                                      projectIdentifier={issue.project_identifier}
                                      issueSequenceId={issue.sequence_id}
                                      textContainerClassName="text-sm text-custom-text-200"
                                    />
                                    <span className="truncate">{issue.name}</span>
                                  </div>
                                )}
                                onSelect={(issue) => {
                                  closePalette();
                                  router.push(
                                    generateWorkItemLink({
                                      workspaceSlug: workspaceSlug.toString(),
                                      projectId: issue.project_id,
                                      issueId: issue.id,
                                      projectIdentifier: issue.project_identifier,
                                      sequenceId: issue.sequence_id,
                                      isEpic: issue.is_epic,
                                    })
                                  );
                                }}
                                emptyText="Search for issue id or issue title"
                              />
                            ) : (
                              <div className="px-3 py-8 text-center text-sm text-custom-text-300">
                                Search for issue id or issue title
                              </div>
                            )
                          ) : issueResults.length > 0 ? (
                            <CommandPaletteEntityList
                              heading="Issues"
                              items={issueResults}
                              getKey={(issue) => issue.id}
                              getLabel={(issue) => `${issue.project__identifier}-${issue.sequence_id} ${issue.name}`}
                              renderItem={(issue) => (
                                <div className="flex items-center gap-2">
                                  <IssueIdentifier
                                    projectId={issue.project_id ?? ""}
                                    projectIdentifier={issue.project__identifier}
                                    issueSequenceId={issue.sequence_id}
                                    textContainerClassName="text-sm text-custom-text-200"
                                  />
                                  <span className="truncate">{issue.name}</span>
                                </div>
                              )}
                              onSelect={(issue) => {
                                closePalette();
                                router.push(
                                  generateWorkItemLink({
                                    workspaceSlug: workspaceSlug.toString(),
                                    projectId: issue.project_id,
                                    issueId: issue.id,
                                    projectIdentifier: issue.project__identifier,
                                    sequenceId: issue.sequence_id,
                                  })
                                );
                              }}
                              emptyText={t("command_k.empty_state.search.title") as string}
                            />
                          ) : (
                            !isLoading &&
                            !isSearching && (
                              <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
                                <SimpleEmptyState
                                  title={t("command_k.empty_state.search.title")}
                                  assetPath={resolvedPath}
                                />
                              </div>
                            )
                          )}
                        </>
                      )}

                      {/* workspace settings actions */}
                      {page === "settings" && workspaceSlug && (
                        <CommandPaletteWorkspaceSettingsActions closePalette={closePalette} />
                      )}

                      {/* issue details page actions */}
                      {page === "change-issue-state" && issueDetails && (
                        <ChangeIssueState closePalette={closePalette} issue={issueDetails} />
                      )}
                      {page === "change-issue-priority" && issueDetails && (
                        <ChangeIssuePriority closePalette={closePalette} issue={issueDetails} />
                      )}
                      {page === "change-issue-assignee" && issueDetails && (
                        <ChangeIssueAssignee closePalette={closePalette} issue={issueDetails} />
                      )}

                      {/* theme actions */}
                      {page === "change-interface-theme" && (
                        <CommandPaletteThemeActions
                          closePalette={() => {
                            closePalette();
                            setPages((pages) => pages.slice(0, -1));
                          }}
                        />
                      )}
                    </Command.List>
                  </Command>
                </div>
                {/* Bottom overlay */}
                <div className="w-full flex items-center justify-between px-4 py-2 border-t border-custom-border-200 bg-custom-background-90/80 rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-custom-text-300">Actions</span>
                    <div className="flex items-center gap-1">
                      <div className="grid h-6 min-w-[1.5rem] place-items-center rounded bg-custom-background-80 border-[0.5px] border-custom-border-200 px-1.5 text-[10px] text-custom-text-200">
                        {platform === "MacOS" ? <CommandIcon className="h-2.5 w-2.5 text-custom-text-200" /> : "Ctrl"}
                      </div>
                      <kbd className="grid h-6 min-w-[1.5rem] place-items-center rounded bg-custom-background-80 border-[0.5px] border-custom-border-200 px-1.5 text-[10px] text-custom-text-200">
                        K
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-custom-text-300">Workspace Level</span>
                    <ToggleSwitch
                      value={isWorkspaceLevel}
                      onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
                      disabled={!projectId}
                      size="sm"
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
