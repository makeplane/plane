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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { NewTabIcon, GlobeIcon } from "@plane/propel/icons";
// ui
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalWidth, ModalCore } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// plane web types
import type { TPagePublishSettings } from "@/types";
import { getIconButtonStyling } from "@plane/propel/icon-button";

type Props = {
  anchor: string | null | undefined;
  fetchPagePublishSettings: () => Promise<TPagePublishSettings>;
  isOpen: boolean;
  onClose: () => void;
  pagePublishSettings: TPagePublishSettings | undefined;
  publishPage: (data: Partial<TPagePublishSettings>) => Promise<TPagePublishSettings>;
  unpublishPage: () => Promise<void>;
};

export const PublishPageModal = observer(function PublishPageModal(props: Props) {
  const { anchor, fetchPagePublishSettings, isOpen, onClose, pagePublishSettings, publishPage, unpublishPage } = props;
  // states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  // derived values
  const isDeployed = !!anchor;

  const handleClose = () => {
    onClose();
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await publishPage({})
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be published. Please try again later.",
        });
      })
      .finally(() => setIsPublishing(false));
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    await unpublishPage()
      .then(() => handleClose())
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be unpublished. Please try again later.",
        });
      })
      .finally(() => setIsUnpublishing(false));
  };

  const SPACE_APP_URL = SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL;
  const publishLink = `${SPACE_APP_URL}${SPACE_BASE_PATH}/pages/${pagePublishSettings?.anchor}`;
  const handleCopyLink = () =>
    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "",
        message: "Published page link copied successfully.",
      })
    );

  useEffect(() => {
    if (isDeployed && !pagePublishSettings) {
      fetchPagePublishSettings();
    }
  }, [fetchPagePublishSettings, isDeployed, pagePublishSettings]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL}>
      <div className="p-5 space-y-4">
        <div className="text-18 font-medium text-secondary">Publish page</div>
        {isDeployed ? (
          <>
            <div className="bg-layer-1 border border-subtle-1 rounded-md py-1.5 pl-4 pr-1 flex items-center justify-between gap-2">
              <a
                href={publishLink}
                className="text-13 text-secondary truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {publishLink}
              </a>
              <div className="shrink-0 flex items-center gap-1">
                <a
                  href={publishLink}
                  className={getIconButtonStyling("tertiary", "lg")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <NewTabIcon className="size-4" />
                </a>
                <Button size="lg" variant={"tertiary"} onClick={handleCopyLink}>
                  Copy link
                </Button>
              </div>
            </div>

            <p className="text-13 font-medium text-accent-primary flex items-center gap-1">
              <span className="shrink-0 relative grid place-items-center size-2.5">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-accent-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-accent-primary" />
              </span>
              This page is now live
            </p>
          </>
        ) : (
          <p className="text-13 text-secondary">Generate a public URL to share this page.</p>
        )}
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-subtle-1">
        <div className="flex items-center gap-1 text-13 text-placeholder">
          <GlobeIcon className="size-3.5" />
          <p className="text-13">Anyone with the link can access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          {isDeployed ? (
            <Button variant="secondary" size="lg" onClick={handleUnpublish} loading={isUnpublishing} tabIndex={1}>
              {isUnpublishing ? "Unpublishing" : "Unpublish"}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={handlePublish} loading={isPublishing} tabIndex={1}>
              {isPublishing ? "Publishing" : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
