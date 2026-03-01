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

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { EyeIcon, TriangleAlert } from "lucide-react";
// plane imports
import { extractJsonFromDocUpdate } from "@plane/editor";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPageVersion, TVersionDiffResponse } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";
// services
import type { TPageType } from "@/services/live.service";
import { liveService } from "@/services/live.service";
// plane web imports
import { EPageStoreType } from "@/plane-web/hooks/store";
// local imports
import { PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM } from "../navigation-pane";
import type { TVersionEditorProps } from "./editor";

type Props = {
  activeVersion: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionJSON: object) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

const storeTypeToPageType = (storeType: EPageStoreType): TPageType => {
  switch (storeType) {
    case EPageStoreType.PROJECT:
      return "project";
    case EPageStoreType.TEAMSPACE:
      return "teamspace";
    case EPageStoreType.WORKSPACE:
      return "workspace";
    default:
      return "workspace";
  }
};

export const PageVersionsMainContent = observer(function PageVersionsMainContent(props: Props) {
  const {
    activeVersion,
    editorComponent,
    fetchAllVersions,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
    storeType,
  } = props;
  // params
  const { workspaceSlug, projectId, teamspaceId } = useParams();
  // search params
  const searchParams = useSearchParams();
  const highlightChangesParam = searchParams.get(PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM);
  const highlightChanges = highlightChangesParam !== "false";
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  // store hooks
  const { data: currentUser } = useUser();

  // Fetch all versions list (still needed for sidebar)
  const { data: versionsList } = useSWR(
    pageId ? `PAGE_VERSIONS_LIST_${pageId}` : null,
    pageId ? () => fetchAllVersions(pageId) : null
  );

  // Find previous version ID from the list (versions are ordered newest first)
  const previousVersionId = useMemo(() => {
    if (!versionsList || !activeVersion) return undefined;
    const currentIndex = versionsList.findIndex((v) => v.id === activeVersion);
    if (currentIndex === -1 || currentIndex >= versionsList.length - 1) return undefined;
    return versionsList[currentIndex + 1].id;
  }, [versionsList, activeVersion]);

  // Fetch version diff from live server
  // Include previousVersionId in cache key to ensure correct diff when version list changes
  // Use primitive boolean to avoid object reference in SWR key condition
  const isVersionsListReady = Boolean(versionsList);
  const {
    data: versionDiff,
    error: versionDiffError,
    mutate: mutateVersionDiff,
  } = useSWR<TVersionDiffResponse>(
    pageId && activeVersion && workspaceSlug && currentUser?.id && isVersionsListReady
      ? `VERSION_DIFF_${pageId}_${activeVersion}_${previousVersionId ?? "none"}`
      : null,
    pageId && activeVersion && workspaceSlug && currentUser?.id && isVersionsListReady
      ? () =>
          liveService.getVersionDiff({
            pageId,
            versionId: activeVersion,
            previousVersionId,
            workspaceSlug: workspaceSlug.toString(),
            userId: currentUser.id,
            pageType: storeTypeToPageType(storeType),
            projectId: projectId?.toString(),
            teamspaceId: teamspaceId?.toString(),
          })
      : null
  );

  // Update versions list with editors when diff is loaded
  useEffect(() => {
    if (activeVersion && versionDiff?.editors?.length && pageId) {
      mutate(
        `PAGE_VERSIONS_LIST_${pageId}`,
        (currentVersions: TPageVersion[] | undefined) => {
          if (!currentVersions) return currentVersions;
          return currentVersions.map((version) =>
            version.id === activeVersion ? { ...version, editors: versionDiff.editors } : version
          );
        },
        { revalidate: false }
      );
    }
  }, [activeVersion, versionDiff?.editors, pageId]);

  const handleRestoreVersion = useCallback(async () => {
    if (!restoreEnabled || !versionDiff?.diffData?.docUpdate) return;
    setIsRestoring(true);
    try {
      const descriptionJson = extractJsonFromDocUpdate(versionDiff.diffData.docUpdate);
      await handleRestore(descriptionJson);
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to restore page version.",
      });
    } finally {
      setIsRestoring(false);
    }
  }, [restoreEnabled, versionDiff?.diffData?.docUpdate, handleRestore, handleClose]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await mutateVersionDiff();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to reload version diff.",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [mutateVersionDiff]);

  const VersionEditor = editorComponent;
  const currentVersion = versionDiff?.currentVersion;

  return (
    <div className="grow flex flex-col overflow-hidden">
      {versionDiffError ? (
        <div className="grow grid place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="shrink-0 grid place-items-center size-11 text-tertiary">
              <TriangleAlert className="size-10" />
            </span>
            <div>
              <h6 className="text-16 font-semibold">Something went wrong!</h6>
              <p className="text-13 text-tertiary">The version could not be loaded, please try again.</p>
            </div>
            <Button variant="link" onClick={handleRetry} loading={isRetrying}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-14 py-3 px-5 border-b border-subtle flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <h6 className="text-14 font-medium">
                {currentVersion
                  ? `${renderFormattedDate(currentVersion.last_saved_at)} ${renderFormattedTime(currentVersion.last_saved_at)}`
                  : "Loading version details…"}
              </h6>
              <span className="flex-shrink-0 flex items-center gap-1 text-11 font-medium text-accent-primary bg-accent-primary/20 py-1 px-1.5 rounded-sm">
                <EyeIcon className="flex-shrink-0 size-3" />
                View only
              </span>
            </div>
            {restoreEnabled ? (
              <Button variant="primary" className="flex-shrink-0" onClick={handleRestoreVersion} loading={isRestoring}>
                {isRestoring ? "Restoring" : "Restore"}
              </Button>
            ) : null}
          </div>
          <div className="pt-8 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
            <VersionEditor
              activeVersion={activeVersion}
              storeType={storeType}
              diffData={versionDiff?.diffData}
              currentVersion={currentVersion}
              editors={versionDiff?.editors}
              versionsList={versionsList}
              highlightChanges={highlightChanges}
            />
          </div>
        </>
      )}
    </div>
  );
});
