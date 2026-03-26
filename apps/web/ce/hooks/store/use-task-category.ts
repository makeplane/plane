import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// type
import type { TaskCategoryStore } from "../../store/task-category.store";
import type { RootStore as _RootStore } from "../../store/root.store";

export const useTaskCategory = (): TaskCategoryStore => {
  const context = useContext(StoreContext) as unknown as _RootStore;
  if (context === undefined) throw new Error("useTaskCategory must be used within StoreProvider");
  return context.taskCategory;
};
