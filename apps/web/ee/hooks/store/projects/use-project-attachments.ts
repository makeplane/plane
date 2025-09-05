import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectAttachmentStore } from "@/plane-web/store/projects/project-details/attachment.store";

export const useProjectAttachments = (): IProjectAttachmentStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectDetails.attachmentStore;
};
