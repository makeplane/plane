import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

// hooks
import useUser from "hooks/use-user";
import useDebounce from "hooks/use-debounce";
// services
import { ProjectService } from "services/project";
// components
import { WebViewModal } from "components/web-view";
import { LayerDiagonalIcon } from "components/icons";
import { Loader, PrimaryButton, SecondaryButton, ToggleSwitch } from "components/ui";
// types
import { ISearchIssueResponse, TProjectIssuesSearchParams } from "types";

type IssuesSelectBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
  searchParams: Partial<TProjectIssuesSearchParams>;
  singleSelect?: boolean;
};

// services
const projectService = new ProjectService();

export const IssuesSelectBottomSheet: React.FC<IssuesSelectBottomSheetProps> = (props) => {
  const { isOpen, onClose, onSubmit, searchParams, singleSelect = false } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);

  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const { user } = useUser();

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setSelectedIssues([]);
    setIsWorkspaceLevel(false);
  };

  const handleSelect = async (data: ISearchIssueResponse[]) => {
    if (!user || !workspaceSlug || !projectId || !issueId) return;

    setIsSubmitting(true);

    await onSubmit(data).finally(() => {
      setIsSubmitting(false);
    });

    handleClose();

    console.log(
      "toast",
      JSON.stringify({
        type: "success",
        message: `Issue${data.length > 1 ? "s" : ""} added successfully.`,
      })
    );
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId || !issueId) return;

    setIsSearching(true);

    projectService
      .projectIssuesSearch(workspaceSlug as string, projectId as string, {
        search: debouncedSearchTerm,
        ...searchParams,
        issue_id: issueId.toString(),
        workspace_search: isWorkspaceLevel,
      })
      .then((res) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, isWorkspaceLevel, issueId, projectId, workspaceSlug, searchParams]);

  return (
    <WebViewModal isOpen={isOpen} onClose={handleClose} modalTitle="Select issue">
      {!isSearching && issues.length === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
          <LayerDiagonalIcon height="52" width="52" />
          <h3 className="text-custom-text-200">
            No issues found. Create a new issue with{" "}
            <pre className="inline rounded bg-custom-background-80 px-2 py-1 text-sm">C</pre>.
          </h3>
        </div>
      )}

      <div
        className={`flex-shrink-0 flex items-center gap-1 text-xs pb-3 cursor-pointer ${
          isWorkspaceLevel ? "text-custom-text-100" : "text-custom-text-200"
        }`}
      >
        <ToggleSwitch value={isWorkspaceLevel} onChange={() => setIsWorkspaceLevel((prevData) => !prevData)} />
        <button type="button" onClick={() => setIsWorkspaceLevel((prevData) => !prevData)} className="flex-shrink-0">
          Workspace Level
        </button>
      </div>

      {isSearching && (
        <Loader className="space-y-3 p-3">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}

      {!isSearching && (
        <WebViewModal.Options
          options={issues.map((issue) => ({
            value: issue.id,
            label: (
              <div className="flex items-center gap-2">
                <span
                  className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: issue.state__color,
                  }}
                />
                <span className="flex-shrink-0 text-xs">
                  {issue.project__identifier}-{issue.sequence_id}
                </span>
                {issue.name}
              </div>
            ),
            checked: selectedIssues.some((i) => i.id === issue.id),
            onClick() {
              if (singleSelect) {
                handleSelect([issue]);
                handleClose();
                return;
              }

              if (selectedIssues.some((i) => i.id === issue.id)) {
                setSelectedIssues(selectedIssues.filter((i) => i.id !== issue.id));
              } else {
                setSelectedIssues([...selectedIssues, issue]);
              }
            },
          }))}
        />
      )}

      {selectedIssues.length > 0 && (
        <WebViewModal.Footer className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
          <PrimaryButton
            onClick={() => {
              handleSelect(selectedIssues);
            }}
            loading={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add selected issues"}
          </PrimaryButton>
        </WebViewModal.Footer>
      )}
    </WebViewModal>
  );
};
