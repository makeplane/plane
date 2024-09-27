import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { IWorkspaceDraftStore } from "@/store/workspace-draft.store";

export const useWorkspaceDraft = (): IWorkspaceDraftStore => {
    const context = useContext(StoreContext);
    if(context === undefined) throw new Error("useWorkspaceDraft must be used within StoreProvider");
    return context.workspaceDraft;
}