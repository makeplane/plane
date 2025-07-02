import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IInitiativeAttachmentStore } from "@/plane-web/store/initiatives/initiative-attachment.store";

export const useInitiativeAttachments = (): IInitiativeAttachmentStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInitiativeAttachments must be used within StoreProvider");
  return context.initiativeStore.initiativeAttachments;
};
