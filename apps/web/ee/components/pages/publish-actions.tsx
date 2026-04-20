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
import { useParams } from "next/navigation";
// plane imports
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
// plane web components
import { PublishPageModal } from "@/plane-web/components/pages";
// plane web hooks
import { usePublishPage, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// store
import type { TPageInstance } from "@/store/pages/base-page";

interface PagePublishActionsProps {
  page: TPageInstance;
}

export const PagePublishActions = observer(function PagePublishActions(props: PagePublishActionsProps) {
  const { page } = props;
  // states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // params
  const { workspaceSlug, pageId } = useParams();
  // store hooks
  const { fetchPagePublishSettings, getPagePublishSettings, publishPage, unpublishPage } = usePublishPage();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const isPagePublishEnabled = useFlag(workspaceSlug?.toString(), "PAGE_PUBLISH");

  // derived values
  const { anchor, archived_at, canCurrentUserPublishPage } = page;
  const isDeployed = !!anchor;
  const isArchived = !!archived_at;
  const pagePublishSettings = getPagePublishSettings(pageId.toString());

  const SPACE_APP_URL = SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL;
  const publishLink = `${SPACE_APP_URL}${SPACE_BASE_PATH}/pages/${anchor}`;

  // Don't show publish actions for archived pages
  if (isArchived) {
    return null;
  }

  // If publish is not enabled, show upgrade button
  if (!isPagePublishEnabled) {
    return (
      <Button variant="secondary" size="lg" onClick={() => togglePaidPlanModal(true)}>
        Upgrade to publish
      </Button>
    );
  }

  // If user doesn't have permission, don't show anything
  if (!canCurrentUserPublishPage) {
    return null;
  }

  return (
    <>
      <PublishPageModal
        anchor={anchor}
        fetchPagePublishSettings={() => fetchPagePublishSettings(pageId.toString())}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        pagePublishSettings={pagePublishSettings}
        publishPage={(data) => publishPage(pageId.toString(), data)}
        unpublishPage={() => unpublishPage(pageId.toString())}
      />
      {isDeployed && (
        <a
          href={publishLink}
          className="h-6 px-2 bg-success-subtle text-success-primary rounded-sm text-11 font-medium flex items-center gap-1.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="flex-shrink-0 rounded-full size-1.5 bg-success-primary" />
          Live
        </a>
      )}
      <Button variant="secondary" onClick={() => setIsPublishModalOpen(true)} className="h-6">
        {isDeployed ? "Unpublish" : "Publish"}
      </Button>
    </>
  );
});
