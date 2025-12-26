import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// assets
import darkIssuesAsset from "@/app/assets/empty-state/search/issues-dark.webp?url";
import lightIssuesAsset from "@/app/assets/empty-state/search/issues-light.webp?url";
import darkSearchAsset from "@/app/assets/empty-state/search/search-dark.webp?url";
import lightSearchAsset from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";

type Props = {
  isOpen: boolean;
  value?: string | null;
  onClose: () => void;
  onSubmit: (issueId: string) => void;
};

const projectService = new ProjectService();

export function SelectDuplicateInboxIssueModal(props: Props) {
  const { isOpen, onClose, onSubmit, value } = props;
  // router
  const { workspaceSlug, projectId, issueId } = useParams();
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // hooks
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  // derived values
  const debouncedSearchTerm: string = useDebounce(query, 500);
  const searchResolvedPath = resolvedTheme === "light" ? lightSearchAsset : darkSearchAsset;
  const issuesResolvedPath = resolvedTheme === "light" ? lightIssuesAsset : darkIssuesAsset;

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);
    projectService
      .projectIssuesSearch(workspaceSlug.toString(), projectId.toString(), {
        search: debouncedSearchTerm,
        workspace_search: false,
      })
      .then((res: ISearchIssueResponse[]) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, projectId, workspaceSlug]);

  const filteredIssues = issues.filter((issue) => issue.id !== issueId);

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  const handleSubmit = (selectedItem: string) => {
    if (!selectedItem || selectedItem.length === 0)
      return setToast({
        title: "Error",
        type: TOAST_TYPE.ERROR,
      });
    onSubmit(selectedItem);
    handleClose();
  };

  const issueList =
    filteredIssues.length > 0 ? (
      <li className="p-2">
        {query === "" && <h2 className="mb-2 mt-4 px-3 text-11 font-semibold text-primary">Select work item</h2>}
        <ul className="text-13 text-primary">
          {filteredIssues.map((issue) => {
            const stateColor = issue.state__color || "";

            return (
              <Combobox.Option
                key={issue.id}
                as="div"
                value={issue.id}
                className={({ active, selected }) =>
                  `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-secondary ${
                    active || selected ? "bg-layer-1 text-primary" : ""
                  } `
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: stateColor,
                    }}
                  />
                  <span className="flex-shrink-0 text-11 text-secondary">
                    {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
                  </span>
                  <span className="text-secondary">{issue.name}</span>
                </div>
              </Combobox.Option>
            );
          })}
        </ul>
      </li>
    ) : (
      <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
        {query === "" ? (
          <SimpleEmptyState title={t("issue_relation.empty_state.no_issues.title")} assetPath={issuesResolvedPath} />
        ) : (
          <SimpleEmptyState title={t("issue_relation.empty_state.search.title")} assetPath={searchResolvedPath} />
        )}
      </div>
    );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox value={value} onChange={handleSubmit}>
        <div className="relative m-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
            aria-hidden="true"
          />
          <input
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-primary outline-none focus:ring-0 sm:text-13"
            placeholder="Search..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <Combobox.Options static className="max-h-80 scroll-py-2 divide-y divide-subtle-1 overflow-y-auto">
          {isSearching ? (
            <Loader className="space-y-3 p-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <>{issueList}</>
          )}
        </Combobox.Options>
      </Combobox>
    </ModalCore>
  );
}
