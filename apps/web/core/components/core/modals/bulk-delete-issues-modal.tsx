import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, IUser } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// assets
import darkIssuesAsset from "@/app/assets/empty-state/search/issues-dark.webp?url";
import lightIssuesAsset from "@/app/assets/empty-state/search/issues-light.webp?url";
import darkSearchAsset from "@/app/assets/empty-state/search/search-dark.webp?url";
import lightSearchAsset from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";
// local components
import { BulkDeleteIssuesModalItem } from "./bulk-delete-issues-modal-item";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | undefined;
};

const projectService = new ProjectService();

export const BulkDeleteIssuesModal = observer(function BulkDeleteIssuesModal(props: Props) {
  const { isOpen, onClose } = props;
  // router params
  const { workspaceSlug, projectId } = useParams();
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // hooks
  const {
    issues: { removeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
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

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    defaultValues: {
      delete_issue_ids: [],
    },
  });

  const handleClose = () => {
    setQuery("");
    reset();
    onClose();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!workspaceSlug || !projectId) return;

    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one work item.",
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    await removeBulkIssues(workspaceSlug, projectId, data.delete_issue_ids)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items deleted successfully!",
        });
        handleClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const issueList =
    issues.length > 0 ? (
      <li className="p-2">
        {query === "" && (
          <h2 className="mb-2 mt-4 px-3 text-11 font-semibold text-primary">Select work items to delete</h2>
        )}
        <ul className="text-13 text-secondary">
          {issues.map((issue) => (
            <BulkDeleteIssuesModalItem
              issue={issue}
              canDeleteIssueIds={watch("delete_issue_ids").includes(issue.id)}
              key={issue.id}
            />
          ))}
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
      <form>
        <Combobox
          onChange={(val: string) => {
            const selectedIssues = watch("delete_issue_ids");
            if (selectedIssues.includes(val))
              setValue(
                "delete_issue_ids",
                selectedIssues.filter((i) => i !== val)
              );
            else setValue("delete_issue_ids", [...selectedIssues, val]);
          }}
        >
          <div className="relative m-1">
            <SearchIcon
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
              aria-hidden="true"
            />
            <input
              type="text"
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-primary outline-none focus:ring-0 sm:text-13"
              placeholder="Search..."
              onChange={(event) => setQuery(event.target.value)}
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

        {issues.length > 0 && (
          <div className="flex items-center justify-end gap-2 p-3">
            <Button variant="secondary" size="lg" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="error-fill" size="lg" onClick={handleSubmit(handleDelete)} loading={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete selected work items"}
            </Button>
          </div>
        )}
      </form>
    </ModalCore>
  );
});
