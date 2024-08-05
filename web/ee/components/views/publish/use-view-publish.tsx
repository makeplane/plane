import { useState } from "react";
import { Share2 } from "lucide-react";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

export const useViewPublish = (isPublished: boolean, isAuthorized: boolean) => {
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  // store hooks
  const { toggleProPlanModal } = useWorkspaceSubscription();
  const isViewsPublishEnabled = useFlag("VIEW_PUBLISH");

  const publishContextMenu = {
    key: "publish",
    action: () => setPublishModalOpen(true),
    title: isPublished ? "Publish Settings" : "Publish",
    icon: Share2,
  };

  const upgradeContextMenu = {
    key: "publish",
    action: () => toggleProPlanModal(true),
    title: "Upgrade to publish",
    icon: Share2,
  };

  if (isViewsPublishEnabled)
    return {
      isPublishModalOpen,
      setPublishModalOpen,
      publishContextMenu: isAuthorized ? publishContextMenu : undefined,
    };

  return {
    isPublishModalOpen: false,
    setPublishModalOpen: toggleProPlanModal,
    publishContextMenu: isAuthorized ? upgradeContextMenu : undefined,
  };
};
