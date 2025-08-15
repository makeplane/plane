import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import { Button } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { PublishPageModal } from "@/plane-web/components/pages";
// plane web hooks
import { usePublishPage, useWorkspaceSubscription, EPageStoreType } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// store
import { TPageInstance } from "@/store/pages/base-page";

interface PagePublishActionsProps {
  page: TPageInstance;
  storeType: EPageStoreType;
}

export const PagePublishActions: React.FC<PagePublishActionsProps> = observer((props) => {
  const { page, storeType } = props;
  // states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // params
  const { workspaceSlug, pageId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { fetchPagePublishSettings, getPagePublishSettings, publishPage, unpublishPage } = usePublishPage();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const isPagePublishEnabled = useFlag(workspaceSlug?.toString(), "PAGE_PUBLISH");

  // derived values
  const { anchor, isCurrentUserOwner, archived_at } = page;
  const isDeployed = !!anchor;
  const isArchived = !!archived_at;
  const pagePublishSettings = getPagePublishSettings(pageId.toString());

  // Get appropriate permission level and roles based on store type
  const isPublishAllowed = (() => {
    switch (storeType) {
      case EPageStoreType.WORKSPACE:
        return isCurrentUserOwner || allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
      case EPageStoreType.PROJECT:
        return isCurrentUserOwner || allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
      default:
        return false;
    }
  })();

  const SPACE_APP_URL = SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL;
  const publishLink = `${SPACE_APP_URL}${SPACE_BASE_PATH}/pages/${anchor}`;

  // Don't show publish actions for archived pages
  if (isArchived) {
    return null;
  }

  // If publish is not enabled, show upgrade button
  if (!isPagePublishEnabled) {
    return (
      <Button variant="accent-primary" size="sm" onClick={() => togglePaidPlanModal(true)}>
        Upgrade to publish
      </Button>
    );
  }

  // If user doesn't have permission, don't show anything
  if (!isPublishAllowed) {
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
          className="h-6 px-2 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
          Live
        </a>
      )}
      <Button variant="outline-primary" size="sm" onClick={() => setIsPublishModalOpen(true)} className="h-6">
        {isDeployed ? "Unpublish" : "Publish"}
      </Button>
    </>
  );
});
