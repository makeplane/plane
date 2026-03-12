import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// type
import type { OpinionStore } from "../../store/opinion.store";
import type { RootStore as _RootStore } from "../../store/root.store";

export const useOpinion = (): OpinionStore => {
  const context = useContext(StoreContext) as unknown as _RootStore;
  if (context === undefined) throw new Error("useOpinion must be used within StoreProvider");
  return context.opinion;
};
