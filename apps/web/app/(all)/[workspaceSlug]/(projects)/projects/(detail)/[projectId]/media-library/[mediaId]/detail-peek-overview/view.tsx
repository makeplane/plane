import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TNameDescriptionLoader } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { cn, getEditorAssetSrc, getFileURL } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import useKeypress from "@/hooks/use-keypress";
import usePeekOverviewOutsideClickDetector from "@/hooks/use-peek-overview-outside-click";
// local imports

import { IssuePeekOverviewError } from "./error";
import type { TPeekModes } from "./header";
import { IssuePeekOverviewHeader } from "./header";
import { PeekOverviewIssueDetails } from "./issue-detail";
import { IssuePeekOverviewLoader } from "./loader";
import { PeekOverviewProperties } from "./properties";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueActivity } from "@/components/issues/issue-detail/issue-activity";
import { IssueDetailWidgets } from "@/components/issues/issue-detail-widgets";
import type { TMediaItem } from "../../types";

const resolveDescriptionImageSrc = (value: string, workspaceSlug: string, projectId: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("http")) {
    return trimmed;
  }
  if (!trimmed.includes("/") && workspaceSlug) {
    return (
      getEditorAssetSrc({
        assetId: trimmed,
        workspaceSlug,
        projectId,
      }) ?? trimmed
    );
  }
  return getFileURL(trimmed) ?? trimmed;
};

const extractDescriptionImageUrls = (descriptionHtml: string | null | undefined, workspaceSlug: string, projectId: string) => {
  if (!descriptionHtml) return [];
  const sources = new Set<string>();

  if (typeof window !== "undefined" && "DOMParser" in window) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(descriptionHtml, "text/html");
      doc.querySelectorAll("img, image-component").forEach((element) => {
        const src =
          element.getAttribute("src")?.trim() ||
          element.getAttribute("data-src")?.trim() ||
          element.getAttribute("data-source")?.trim();
        if (src) {
          const resolved = resolveDescriptionImageSrc(src, workspaceSlug, projectId);
          if (resolved) sources.add(resolved);
        }
      });
    } catch {
      // fall back to regex parsing
    }
  }

  if (sources.size === 0) {
    const regex = /<(?:img|image-component)[^>]+src=["']?([^"'>\s]+)["']?/gi;
    let match = regex.exec(descriptionHtml);
    while (match) {
      if (match[1]) {
        const resolved = resolveDescriptionImageSrc(match[1], workspaceSlug, projectId);
        if (resolved) sources.add(resolved);
      }
      match = regex.exec(descriptionHtml);
    }
  }

  return Array.from(sources);
};

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
  mediaItem?: TMediaItem;
  onMediaItemUpdated?: (updates?: Partial<TMediaItem>) => void;
}

export const IssueView: FC<IIssueView> = observer((props) => {
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
    mediaItem,
    onMediaItemUpdated,
  } = props;
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const [isDeleteIssueModalOpen, setIsDeleteIssueModalOpen] = useState(false);
  const [isArchiveIssueModalOpen, setIsArchiveIssueModalOpen] = useState(false);
  const [isDuplicateIssueModalOpen, setIsDuplicateIssueModalOpen] = useState(false);
  const [isEditIssueModalOpen, setIsEditIssueModalOpen] = useState(false);
  const [isInlineCleanupModalOpen, setIsInlineCleanupModalOpen] = useState(false);
  const [descriptionHtmlOverride, setDescriptionHtmlOverride] = useState<string | null>(null);
  // ref
  const issuePeekOverviewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const {
    setPeekIssue,
    isAnyModalOpen,
    issue: { getIssueById, getIsLocalDBIssueDescription },
  } = useIssueDetail();
  const { isAnyModalOpen: isAnyEpicModalOpen } = useIssueDetail(EIssueServiceType.EPICS);
  const issue = getIssueById(issueId);
  useEffect(() => {
    setDescriptionHtmlOverride(null);
  }, [issueId]);
  const descriptionHtmlSource = descriptionHtmlOverride ?? issue?.description_html ?? null;
  const descriptionImageUrls = useMemo(
    () => extractDescriptionImageUrls(descriptionHtmlSource, workspaceSlug, projectId),
    [descriptionHtmlSource, projectId, workspaceSlug]
  );
  const handleDescriptionChange = useCallback((value: string) => {
    setDescriptionHtmlOverride(value);
  }, []);
  // remove peek id
  const removeRoutePeekId = () => {
    setPeekIssue(undefined);
    if (embedIssue && embedRemoveCurrentNotification) embedRemoveCurrentNotification();
  };

  const isLocalDBIssueDescription = getIsLocalDBIssueDescription(issueId);

  const toggleDeleteIssueModal = (value: boolean) => setIsDeleteIssueModalOpen(value);
  const toggleArchiveIssueModal = (value: boolean) => setIsArchiveIssueModalOpen(value);
  const toggleDuplicateIssueModal = (value: boolean) => setIsDuplicateIssueModalOpen(value);
  const toggleEditIssueModal = (value: boolean) => setIsEditIssueModalOpen(value);

  const isAnyLocalModalOpen =
    isDeleteIssueModalOpen || isArchiveIssueModalOpen || isDuplicateIssueModalOpen || isEditIssueModalOpen;
  const isAnyLocalModalOpenWithInline = isAnyLocalModalOpen || isInlineCleanupModalOpen;

  usePeekOverviewOutsideClickDetector(
    issuePeekOverviewRef,
    () => {
      const isAnyDropbarOpen = editorRef.current?.isAnyDropbarOpen();
      if (!embedIssue) {
        if (!isAnyModalOpen && !isAnyEpicModalOpen && !isAnyLocalModalOpenWithInline && !isAnyDropbarOpen) {
          removeRoutePeekId();
        }
      }
    },
    issueId
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
      ? "absolute z-[25] flex flex-col overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 transition-all duration-300"
      : `w-full h-full`,
    !embedIssue && {
      "top-0 bottom-0 right-0 w-full md:w-[50%] border-0 border-l": peekMode === "side-peek",
      "size-5/6 top-[8.33%] left-[8.33%]": peekMode === "modal",
      "inset-0 m-4 absolute": peekMode === "full-screen",
    }
  );

  const shouldUsePortal = !embedIssue;

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div className="h-full w-full !text-base">
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
              {!embedIssue && (
                <IssuePeekOverviewHeader
                  peekMode={peekMode}
                  setPeekMode={(value) => setPeekMode(value)}
                  removeRoutePeekId={removeRoutePeekId}
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
                  descriptionImageUrls={descriptionImageUrls}
                  onInlineCleanupModalChange={setIsInlineCleanupModalOpen}
                />
              )}
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
                      disabled={disabled || isLocalDBIssueDescription}
                      isArchived={is_archived}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={(value) => setIsSubmitting(value)}
                      onDescriptionChange={mediaItem ? undefined : handleDescriptionChange}
                      mediaItem={mediaItem}
                      onMediaItemUpdated={onMediaItemUpdated}
                    />

                    {!embedIssue && (
                      <div className="py-2">
                        <IssueDetailWidgets
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          issueId={issueId}
                          disabled={disabled || is_archived}
                          issueServiceType={EIssueServiceType.ISSUES}
                          hideMediaLibraryButton
                          confirmManifestOnDelete
                        />
                      </div>
                    )}

                    <PeekOverviewProperties
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      issueId={issueId}
                      issueOperations={issueOperations}
                      disabled={disabled || is_archived}
                    />

                    {!embedIssue && (
                      <IssueActivity
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        issueId={issueId}
                        disabled={is_archived}
                      />
                    )}
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
                          disabled={disabled || isLocalDBIssueDescription}
                          isArchived={is_archived}
                          isSubmitting={isSubmitting}
                          setIsSubmitting={(value) => setIsSubmitting(value)}
                          onDescriptionChange={mediaItem ? undefined : handleDescriptionChange}
                          mediaItem={mediaItem}
                          onMediaItemUpdated={onMediaItemUpdated}
                        />

                        {!embedIssue && (
                          <div className="py-2">
                            <IssueDetailWidgets
                              workspaceSlug={workspaceSlug}
                              projectId={projectId}
                              issueId={issueId}
                              disabled={disabled}
                              issueServiceType={EIssueServiceType.ISSUES}
                              hideMediaLibraryButton
                              confirmManifestOnDelete
                            />
                          </div>
                        )}

                        {!embedIssue && (
                          <IssueActivity
                            workspaceSlug={workspaceSlug}
                            projectId={projectId}
                            issueId={issueId}
                            disabled={is_archived}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className={`h-full !w-[400px] flex-shrink-0 border-l border-custom-border-200 p-4 py-5 overflow-hidden vertical-scrollbar scrollbar-sm ${
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
