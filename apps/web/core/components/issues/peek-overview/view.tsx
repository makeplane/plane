/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TIssue, TNameDescriptionLoader } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import useKeypress from "@/hooks/use-keypress";
import usePeekOverviewOutsideClickDetector from "@/hooks/use-peek-overview-outside-click";
// plane web hooks
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import type { TIssueOperations } from "../issue-detail";
import { IssueActivity } from "../issue-detail/issue-activity";
import { IssueDetailWidgets } from "../issue-detail-widgets";
import { IssuePeekOverviewError } from "./error";
import type { TPeekModes } from "./header";
import { IssuePeekOverviewHeader } from "./header";
import { PeekOverviewIssueDetails } from "./issue-detail";
import { IssuePeekOverviewLoader } from "./loader";
import { PeekOverviewProperties } from "./properties";

interface IIssueView {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isLoading?: boolean;
  isError?: boolean;
  is_archived: boolean;
  disabled?: boolean;
  embedIssue?: boolean;
  embedRemoveCurrentNotification?: () => void;
  issueOperations: TIssueOperations;
  permissions: {
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: keyof TIssue) => boolean; // TODO: <permissionEngine> update property type to TWorkItemProperty
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
}

export const IssueView = observer(function IssueView(props: IIssueView) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    isLoading,
    isError,
    is_archived,
    disabled = false,
    embedIssue = false,
    embedRemoveCurrentNotification,
    issueOperations,
    permissions,
  } = props;
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const [isVotingMembersModalOpen, setIsVotingMembersModalOpen] = useState(false);
  const [isDeleteIssueModalOpen, setIsDeleteIssueModalOpen] = useState(false);
  const [isArchiveIssueModalOpen, setIsArchiveIssueModalOpen] = useState(false);
  const [isDuplicateIssueModalOpen, setIsDuplicateIssueModalOpen] = useState(false);
  const [isEditIssueModalOpen, setIsEditIssueModalOpen] = useState(false);
  // ref
  const issuePeekOverviewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const {
    setPeekIssue,
    isAnyModalOpen,
    issue: { getIssueById },
  } = useIssueDetail();
  const { isAnyModalOpen: isAnyEpicModalOpen } = useIssueDetail(EIssueServiceType.EPICS);
  const { isAnyModalOpen: isAnyCustomerModalOpen } = useCustomers();
  const issue = getIssueById(issueId);
  // remove peek id
  const removeRoutePeekId = () => {
    setPeekIssue(undefined);
    if (embedIssue && embedRemoveCurrentNotification) embedRemoveCurrentNotification();
  };

  const toggleVotingMembersModal = (value: boolean) => setIsVotingMembersModalOpen(value);
  const toggleDeleteIssueModal = (value: boolean) => setIsDeleteIssueModalOpen(value);
  const toggleArchiveIssueModal = (value: boolean) => setIsArchiveIssueModalOpen(value);
  const toggleDuplicateIssueModal = (value: boolean) => setIsDuplicateIssueModalOpen(value);
  const toggleEditIssueModal = (value: boolean) => setIsEditIssueModalOpen(value);

  const isAnyLocalModalOpen =
    isVotingMembersModalOpen ||
    isDeleteIssueModalOpen ||
    isArchiveIssueModalOpen ||
    isDuplicateIssueModalOpen ||
    isEditIssueModalOpen;

  usePeekOverviewOutsideClickDetector(
    issuePeekOverviewRef,
    () => {
      const isAnyDropbarOpen = editorRef.current?.isAnyDropbarOpen();
      if (!embedIssue) {
        if (
          !isAnyModalOpen &&
          !isAnyEpicModalOpen &&
          !isAnyLocalModalOpen &&
          !isAnyDropbarOpen &&
          !isAnyCustomerModalOpen
        ) {
          removeRoutePeekId();
        }
      }
    },
    issueId,
    ["main-sidebar", "app-rail"]
  );

  const handleKeyDown = () => {
    const editorImageFullScreenModalElement = document.querySelector(".editor-image-full-screen-modal");
    const dropdownElement = document.activeElement?.tagName === "INPUT";
    const isAnyDropbarOpen = editorRef.current?.isAnyDropbarOpen();
    if (!isAnyModalOpen && !dropdownElement && !isAnyDropbarOpen && !editorImageFullScreenModalElement) {
      removeRoutePeekId();
      const issueElement = document.getElementById(`issue-${issueId}`);
      if (issueElement) issueElement?.focus();
    }
  };

  useKeypress("Escape", () => !embedIssue && handleKeyDown());

  const handleRestore = async () => {
    if (!issueOperations.restore) return;
    await issueOperations.restore(workspaceSlug, projectId, issueId);
    removeRoutePeekId();
  };

  const peekOverviewIssueClassName = cn(
    !embedIssue
      ? "absolute z-[25] flex flex-col overflow-hidden rounded-sm border border-subtle bg-surface-1 transition-all duration-300"
      : `w-full h-full`,
    !embedIssue && {
      "top-0 bottom-0 right-0 w-full lg:w-[1024px] border-0 border-l": peekMode === "side-peek",
      "size-5/6 top-[8.33%] left-[8.33%]": peekMode === "modal",
      "inset-0 m-4 absolute": peekMode === "full-screen",
    }
  );

  const shouldUsePortal = !embedIssue;

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div className="w-full text-body-sm-regular">
      {issueId && (
        <div
          ref={issuePeekOverviewRef}
          className={peekOverviewIssueClassName}
          style={{
            boxShadow:
              "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
          }}
        >
          {isError ? (
            <div className="relative h-screen w-full overflow-hidden">
              <IssuePeekOverviewError removeRoutePeekId={removeRoutePeekId} />
            </div>
          ) : (
            isLoading && <IssuePeekOverviewLoader removeRoutePeekId={removeRoutePeekId} />
          )}
          {!isLoading && !isError && issue && (
            <>
              {/* header */}
              <IssuePeekOverviewHeader
                peekMode={peekMode}
                setPeekMode={(value) => setPeekMode(value)}
                removeRoutePeekId={removeRoutePeekId}
                toggleVotingMembersModal={toggleVotingMembersModal}
                toggleDeleteIssueModal={toggleDeleteIssueModal}
                toggleArchiveIssueModal={toggleArchiveIssueModal}
                toggleDuplicateIssueModal={toggleDuplicateIssueModal}
                toggleEditIssueModal={toggleEditIssueModal}
                handleRestoreIssue={handleRestore}
                isArchived={is_archived}
                issueId={issueId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                isSubmitting={isSubmitting}
                disabled={disabled}
                embedIssue={embedIssue}
              />
              {/* content */}
              <div className="vertical-scrollbar scrollbar-md relative h-full w-full overflow-hidden overflow-y-auto">
                {["side-peek", "modal"].includes(peekMode) ? (
                  <div className="relative flex flex-col gap-3 px-8 py-5 space-y-3">
                    <PeekOverviewIssueDetails
                      editorRef={editorRef}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      issueId={issueId}
                      issueOperations={issueOperations}
                      disabled={disabled}
                      isArchived={is_archived}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={(value) => setIsSubmitting(value)}
                    />

                    <div className="py-2">
                      <IssueDetailWidgets
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        disabled={disabled || is_archived}
                        issueServiceType={EIssueServiceType.ISSUES}
                        permissions={permissions}
                      />
                    </div>

                    <PeekOverviewProperties
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      issueId={issueId}
                      issueOperations={issueOperations}
                      disabled={disabled || is_archived}
                    />

                    <IssueActivity
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      issueId={issueId}
                      disabled={is_archived}
                    />
                  </div>
                ) : (
                  <div className="vertical-scrollbar flex h-full w-full overflow-auto">
                    <div className="relative h-full w-full space-y-6 overflow-auto p-4 py-5">
                      <div className="space-y-3">
                        <PeekOverviewIssueDetails
                          editorRef={editorRef}
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          issueOperations={issueOperations}
                          disabled={disabled}
                          isArchived={is_archived}
                          isSubmitting={isSubmitting}
                          setIsSubmitting={(value) => setIsSubmitting(value)}
                        />

                        <div className="py-2">
                          <IssueDetailWidgets
                            workspaceSlug={workspaceSlug}
                            projectId={projectId}
                            issueId={issueId}
                            disabled={disabled}
                            issueServiceType={EIssueServiceType.ISSUES}
                            permissions={permissions}
                          />
                        </div>

                        <IssueActivity
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          disabled={is_archived}
                        />
                      </div>
                    </div>
                    <div
                      className={`h-full !w-[400px] flex-shrink-0 border-l border-subtle p-4 py-5 overflow-hidden vertical-scrollbar scrollbar-sm ${
                        is_archived ? "pointer-events-none" : ""
                      }`}
                    >
                      <PeekOverviewProperties
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        issueOperations={issueOperations}
                        disabled={disabled || is_archived}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return <>{shouldUsePortal && portalContainer ? createPortal(content, portalContainer) : content}</>;
});
