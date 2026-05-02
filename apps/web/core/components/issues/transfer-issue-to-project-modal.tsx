/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertCircle, Search, MoveRight } from "lucide-react";
import { SearchIcon, ProjectIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  issueIds: string[];
  sourceProjectId: string;
  onSuccess?: () => void;
};

export const TransferIssueToProjectModal = observer(function TransferIssueToProjectModal(props: Props) {
  const { isOpen, handleClose, issueIds, sourceProjectId, onSuccess } = props;
  const [query, setQuery] = useState("");

  const { workspaceSlug } = useParams();
  const { joinedProjectIds, getProjectById } = useProject();
  const { issues } = useIssues(EIssuesStoreType.PROJECT);

  const availableProjectIds = joinedProjectIds?.filter((id) => id !== sourceProjectId) ?? [];

  const filteredOptions = availableProjectIds.filter((projectId) => {
    const projectDetails = getProjectById(projectId);
    if (!projectDetails) return false;
    return query === "" || projectDetails.name?.toLowerCase().includes(query?.toLowerCase());
  });

  const handleTransfer = async (targetProjectId: string) => {
    if (!workspaceSlug || !sourceProjectId || issueIds.length === 0) return;

    const targetProject = getProjectById(targetProjectId);
    const isMultiple = issueIds.length > 1;

    const transferPromise = isMultiple
      ? issues.bulkTransferIssues(
          workspaceSlug.toString(),
          sourceProjectId,
          targetProjectId,
          issueIds
        )
      : issues.transferIssue(
          workspaceSlug.toString(),
          sourceProjectId,
          targetProjectId,
          issueIds[0]
        );

    setPromiseToast(transferPromise, {
      loading: isMultiple
        ? `Moving ${issueIds.length} work items to ${targetProject?.name}...`
        : `Moving work item to ${targetProject?.name}...`,
      success: {
        title: "Success!",
        message: () =>
          isMultiple
            ? `${issueIds.length} work items moved to ${targetProject?.name} successfully`
            : `Work item moved to ${targetProject?.name} successfully`,
      },
      error: {
        title: "Error!",
        message: () =>
          isMultiple
            ? `Unable to move work items to ${targetProject?.name}. Please try again.`
            : `Unable to move work item to ${targetProject?.name}. Please try again.`,
      },
    });

    try {
      const response = await transferPromise;
      if (response.success) {
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error transferring issues:", error);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-4 py-5">
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-1">
            <MoveRight className="w-5 fill-primary" />
            <h4 className="text-18 font-medium text-primary">
              Move {issueIds.length > 1 ? `${issueIds.length} work items` : "work item"} to project
            </h4>
          </div>
          <button onClick={handleClose}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-subtle px-5 pb-3">
          <SearchIcon className="h-4 w-4 text-secondary" />
          <input
            className="text-13 outline-none"
            placeholder="Search for a project..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
        </div>
        <div className="flex w-full flex-col items-start gap-2 px-5">
          {availableProjectIds.length > 0 ? (
            filteredOptions.length > 0 ? (
              filteredOptions.map((projectId) => {
                const projectDetails = getProjectById(projectId);

                if (!projectDetails) return null;

                return (
                  <button
                    key={projectId}
                    className="flex w-full items-center gap-4 rounded-sm px-4 py-3 text-13 text-secondary hover:bg-surface-2"
                    onClick={() => handleTransfer(projectId)}
                  >
                    <ProjectIcon className="h-5 w-5" />
                    <div className="flex w-full justify-between truncate">
                      <span className="truncate">{projectDetails.name}</span>
                      {projectDetails.identifier && (
                        <span className="flex flex-shrink-0 items-center rounded-full bg-layer-1 px-2 capitalize">
                          {projectDetails.identifier}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex w-full items-center justify-center gap-4 p-5 text-13">
                <AlertCircle className="h-3.5 w-3.5 text-secondary" />
                <span className="text-center text-secondary">No matching projects found.</span>
              </div>
            )
          ) : (
            <div className="flex w-full items-center justify-center gap-4 p-5 text-13">
              <AlertCircle className="h-3.5 w-3.5 text-secondary" />
              <span className="text-center text-secondary">
                You don't have access to any other projects to move work items to.
              </span>
            </div>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
