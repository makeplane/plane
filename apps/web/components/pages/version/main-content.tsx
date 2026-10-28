/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ShowOutline } from "@makeplane/propel/icons";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { setToast } from "@plane/blocks/toast";
import type { TPageVersion } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// helpers
import type { EPageStoreType } from "@/hooks/store";
// local imports
import type { TVersionEditorProps } from "./editor";

type Props = {
  activeVersion: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsMainContent = observer(function PageVersionsMainContent(props: Props) {
  const {
    activeVersion,
    editorComponent,
    fetchVersionDetails,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
    storeType,
  } = props;
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data: versionDetails,
    error: versionDetailsError,
    mutate: mutateVersionDetails,
  } = useSWR(
    pageId && activeVersion ? `PAGE_VERSION_${activeVersion}` : null,
    pageId && activeVersion ? () => fetchVersionDetails(pageId, activeVersion) : null
  );

  const handleRestoreVersion = async () => {
    if (!restoreEnabled) return;
    setIsRestoring(true);
    await handleRestore(versionDetails?.description_html ?? "<p></p>")
      .then(() => {
        setToast({
          type: "success",
          title: "Page version restored.",
        });
        handleClose();
      })
      .catch(() =>
        setToast({
          type: "error",
          title: "Failed to restore page version.",
        })
      )
      .finally(() => setIsRestoring(false));
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await mutateVersionDetails();
    setIsRetrying(false);
  };

  const VersionEditor = editorComponent;

  return (
    <div className="flex flex-grow flex-col overflow-hidden">
      {versionDetailsError ? (
        <EmptyStateCompact
          assetKey="unknown"
          rootClassName="grow"
          title="Something went wrong!"
          description="The version could not be loaded, please try again."
          actions={[
            {
              label: "Try again",
              variant: "secondary",
              onClick: () => void handleRetry(),
              loading: isRetrying,
            },
          ]}
        />
      ) : (
        <>
          <div className="flex min-h-14 items-center justify-between gap-2 border-b border-subtle px-5 py-3">
            <div className="flex items-center gap-4">
              <h6 className="text-body-sm-medium text-primary">
                {versionDetails
                  ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
                  : "Loading version details"}
              </h6>
              <Badge variant="brand" size="sm" startIcon={<Icon icon={ShowOutline} />} label="View only" />
            </div>
            {restoreEnabled && (
              <Button
                variant="primary"
                size="sm"
                stretch="auto"
                label={isRestoring ? "Restoring" : "Restore"}
                onClick={() => void handleRestoreVersion()}
                loading={isRestoring}
              />
            )}
          </div>
          <div className="vertical-scrollbar scrollbar-sm h-full overflow-y-scroll pt-8">
            <VersionEditor activeVersion={activeVersion} storeType={storeType} versionDetails={versionDetails} />
          </div>
        </>
      )}
    </div>
  );
});
