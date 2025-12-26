import { useEffect, useState, useRef } from "react";
import { Rocket } from "lucide-react";
import { Combobox } from "@headlessui/react";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { Button } from "@plane/propel/button";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
// ui
import { Loader, ToggleSwitch, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { generateWorkItemLink, getTabIndex } from "@plane/utils";
// helpers
// hooks
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// services
import { ProjectService } from "@/services/project";
// components
import { IssueSearchModalEmptyState } from "./issue-search-modal-empty-state";

type Props = {
  workspaceSlug: string | undefined;
  projectId?: string;
  isOpen: boolean;
  handleClose: () => void;
  searchParams: Partial<TProjectIssuesSearchParams>;
  handleOnSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  workspaceLevelToggle?: boolean;
  shouldHideIssue?: (issue: ISearchIssueResponse) => boolean;
  selectedWorkItemIds?: string[];
  workItemSearchServiceCallback?: (params: TProjectIssuesSearchParams) => Promise<ISearchIssueResponse[]>;
};

const projectService = new ProjectService();

export function ExistingIssuesListModal(props: Props) {
  const { t } = useTranslation();

  const {
    workspaceSlug,
    projectId,
    isOpen,
    handleClose: onClose,
    searchParams,
    handleOnSubmit,
    workspaceLevelToggle = false,
    shouldHideIssue,
    selectedWorkItemIds,
    workItemSearchServiceCallback,
  } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const { isMobile } = usePlatformOS();
  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  const hasInitializedSelection = useRef(false);

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedIssues([]);
    setIsWorkspaceLevel(false);
    hasInitializedSelection.current = false;
  };

  const onSubmit = async () => {
    if (selectedIssues.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("issue.select.error"),
      });

      return;
    }

    setIsSubmitting(true);

    await handleOnSubmit(selectedIssues).finally(() => setIsSubmitting(false));

    handleClose();
  };

  const handleSearch = () => {
    if (!isOpen || !workspaceSlug) return;
    setIsLoading(true);
    const searchService =
      workItemSearchServiceCallback ??
      (projectId
        ? projectService.projectIssuesSearch.bind(projectService, workspaceSlug?.toString(), projectId?.toString())
        : undefined);
    if (!searchService) return;
    searchService({
      search: debouncedSearchTerm,
      ...searchParams,
      workspace_search: isWorkspaceLevel,
    })
      .then((res) => setIssues(res))
      .finally(() => {
        setIsSearching(false);
        setIsLoading(false);
      });
  };

  const handleSelectIssues = () => {
    setSelectedIssues((prevData) => (prevData.length === filteredIssues.length ? [] : [...filteredIssues]));
  };

  useEffect(() => {
    if (isOpen && !hasInitializedSelection.current && selectedWorkItemIds && issues.length > 0) {
      setSelectedIssues(issues.filter((issue) => selectedWorkItemIds.includes(issue.id)));
      hasInitializedSelection.current = true;
    }
  }, [isOpen, issues, selectedWorkItemIds]);

  useEffect(() => {
    handleSearch();
  }, [debouncedSearchTerm, isOpen, isWorkspaceLevel, projectId, workspaceSlug]);

  const filteredIssues = issues.filter((issue) => !shouldHideIssue?.(issue));

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox
        as="div"
        onChange={(val: ISearchIssueResponse) => {
          if (selectedIssues.some((i) => i.id === val.id))
            setSelectedIssues((prevData) => prevData.filter((i) => i.id !== val.id));
          else setSelectedIssues((prevData) => [...prevData, val]);
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("common.search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tabIndex={baseTabIndex}
          />
        </div>

        <div className="flex flex-col-reverse gap-4 p-2 text-13 text-secondary sm:flex-row sm:items-center sm:justify-between">
          {selectedIssues.length > 0 ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {selectedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-1 whitespace-nowrap rounded-md border border-subtle bg-layer-1 py-1 pl-2 text-11 text-primary"
                >
                  <IssueIdentifier
                    projectId={issue.project_id}
                    issueTypeId={issue.type_id}
                    projectIdentifier={issue.project__identifier}
                    issueSequenceId={issue.sequence_id}
                    size="xs"
                    variant="secondary"
                  />
                  <button
                    type="button"
                    className="group p-1"
                    onClick={() => setSelectedIssues((prevData) => prevData.filter((i) => i.id !== issue.id))}
                  >
                    <CloseIcon className="h-3 w-3 text-secondary group-hover:text-primary" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-min whitespace-nowrap rounded-md border border-subtle bg-layer-1 p-2 text-11">
              {t("issue.select.empty")}
            </div>
          )}
          {workspaceLevelToggle && (
            <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
              <div
                className={`flex flex-shrink-0 cursor-pointer items-center gap-1 text-11 ${
                  isWorkspaceLevel ? "text-primary" : "text-secondary"
                }`}
              >
                <ToggleSwitch value={isWorkspaceLevel} onChange={() => setIsWorkspaceLevel((prevData) => !prevData)} />
                <button
                  type="button"
                  onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                  className="flex-shrink-0"
                >
                  {t("common.workspace_level")}
                </button>
              </div>
            </Tooltip>
          )}
        </div>

        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {/* TODO: Translate here */}
          {searchTerm !== "" && (
            <h5 className="mx-2 text-13 text-secondary">
              Search results for{" "}
              <span className="text-primary">
                {'"'}
                {searchTerm}
                {'"'}
              </span>{" "}
              in project:
            </h5>
          )}

          {isSearching || isLoading ? (
            <Loader className="space-y-3 p-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <>
              {filteredIssues.length === 0 ? (
                <IssueSearchModalEmptyState
                  debouncedSearchTerm={debouncedSearchTerm}
                  isSearching={isSearching}
                  issues={filteredIssues}
                  searchTerm={searchTerm}
                />
              ) : (
                <ul className={`text-13 text-primary ${filteredIssues.length > 0 ? "p-2" : ""}`}>
                  {filteredIssues.map((issue) => {
                    const selected = selectedIssues.some((i) => i.id === issue.id);

                    return (
                      <Combobox.Option
                        key={issue.id}
                        as="label"
                        htmlFor={`issue-${issue.id}`}
                        value={issue}
                        className={({ active }) =>
                          `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${
                            active ? "bg-layer-1 text-primary" : ""
                          } ${selected ? "text-primary" : ""}`
                        }
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input type="checkbox" checked={selected} readOnly />
                          <span
                            className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: issue.state__color,
                            }}
                          />
                          <span className="flex-shrink-0">
                            <IssueIdentifier
                              projectId={issue.project_id}
                              issueTypeId={issue.type_id}
                              projectIdentifier={issue.project__identifier}
                              issueSequenceId={issue.sequence_id}
                              size="xs"
                              variant="secondary"
                            />
                          </span>
                          <span className="truncate">{issue.name}</span>
                        </div>
                        <a
                          href={generateWorkItemLink({
                            workspaceSlug,
                            projectId: issue?.project_id,
                            issueId: issue?.id,
                            projectIdentifier: issue.project__identifier,
                            sequenceId: issue?.sequence_id,
                          })}
                          target="_blank"
                          className="z-1 relative hidden flex-shrink-0 text-secondary hover:text-primary group-hover:block"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Rocket className="h-4 w-4" />
                        </a>
                      </Combobox.Option>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex justify-between items-center p-3">
        <Button
          variant="link"
          onClick={handleSelectIssues}
          disabled={filteredIssues.length === 0}
          className={filteredIssues.length === 0 ? "p-0" : ""}
        >
          {selectedIssues.length === issues.length ? t("issue.select.deselect_all") : t("issue.select.select_all")}
        </Button>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || selectedIssues.length === 0}
          >
            {isSubmitting ? t("common.adding") : t("issue.select.add_selected")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
