// react
import React, { useState, useEffect } from "react";

// next
import { useRouter } from "next/router";

// hooks
import useUser from "hooks/use-user";
import useDebounce from "hooks/use-debounce";

// services
import projectService from "services/project.service";

// components
import { WebViewModal } from "components/web-view";
import { LayerDiagonalIcon } from "components/icons";
import { Loader, PrimaryButton, SecondaryButton, ToggleSwitch } from "components/ui";

// types
import { ISearchIssueResponse } from "types";

type IssuesSelectBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ISearchIssueResponse[]) => Promise<void>;
};

export const IssuesSelectBottomSheet: React.FC<IssuesSelectBottomSheetProps> = (props) => {
  const { isOpen, onClose, onSubmit } = props;

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
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId || !issueId) return;

    setIsSearching(true);

    projectService
      .projectIssuesSearch(workspaceSlug as string, projectId as string, {
        search: debouncedSearchTerm,
        issue_relation: true,
        issue_id: issueId.toString(),
        workspace_search: isWorkspaceLevel,
      })
      .then((res) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, isWorkspaceLevel, issueId, projectId, workspaceSlug]);

  return (
    <WebViewModal isOpen={isOpen} onClose={onClose} modalTitle="Select issue">
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
        className={`flex-shrink-0 flex items-center gap-1 text-xs cursor-pointer ${
          isWorkspaceLevel ? "text-custom-text-100" : "text-custom-text-200"
        }`}
      >
        <ToggleSwitch
          value={isWorkspaceLevel}
          onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
        />
        <button
          type="button"
          onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
          className="flex-shrink-0"
        >
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
          options={issues.map((issues) => ({
            value: issues.id,
            label: issues.name,
            checked: selectedIssues.some((i) => i.id === issues.id),
            onClick() {
              if (selectedIssues.some((i) => i.id === issues.id)) {
                setSelectedIssues(selectedIssues.filter((i) => i.id !== issues.id));
              } else {
                setSelectedIssues([...selectedIssues, issues]);
              }
            },
          }))}
        />
      )}

      {selectedIssues.length > 0 && (
        <WebViewModal.Footer className="flex items-center justify-end gap-2 p-3">
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
