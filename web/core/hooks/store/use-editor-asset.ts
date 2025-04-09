import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import { IEditorAssetStore } from "@/store/editor/asset.store";

export const useEditorAsset = (): IEditorAssetStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEditorAsset must be used within StoreProvider");
  return context.editorAssetStore;
};
