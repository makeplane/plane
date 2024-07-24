import { Share2 } from "lucide-react";
import { useState } from "react";

export const useViewPublish = (isPublished: boolean, isAuthorized: boolean) => {
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);

  const publishContextMenu = {
    key: "publish",
    action: () => setPublishModalOpen(true),
    title: isPublished ? "Publish Settings" : "Publish",
    icon: Share2,
  };

  return {
    isPublishModalOpen,
    setPublishModalOpen,
    publishContextMenu: isAuthorized ? publishContextMenu : undefined,
  };
};
