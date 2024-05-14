import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/app-providers";
// store
import { IProjectStore } from "@/store/project.store";

export const useProject = (): IProjectStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserProfile must be used within StoreProvider");
  return context.project;
};
