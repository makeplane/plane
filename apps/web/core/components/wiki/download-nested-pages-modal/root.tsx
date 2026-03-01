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

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { ModalCore } from "@plane/ui";
// plane web imports
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePage } from "@/plane-web/hooks/store";
// local imports
import { DownloadNestedPagesModalSubPageItem } from "./sub-page-item";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  storeType: EPageStoreType;
};

export const DownloadNestedPagesModal = observer(function DownloadNestedPagesModal(props: Props) {
  const { isOpen, onClose, pageId, storeType } = props;
  // states
  const [isDownloading, setIsDownloading] = useState(false);
  // store hooks
  const page = usePage({
    pageId,
    storeType,
  });
  // derived values
  const { subPageIds } = page ?? {};

  const handleDownload = async () => {
    setIsDownloading(true);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">Download nested pages data</h3>
          <div className="mt-2 space-y-4">
            <p className="text-13 text-secondary">
              All the data from the nested pages listed below will be downloaded. You{"'"}ll receive an email with the
              files once ready. This may take 5{"'"}10 minutes.
            </p>
            <div className="space-y-2">
              {subPageIds?.map((subPageId) => (
                <DownloadNestedPagesModalSubPageItem key={subPageId} pageId={subPageId} storeType={storeType} />
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDownload} loading={isDownloading}>
            {isDownloading ? "Downloading" : "Download"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
