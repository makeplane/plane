import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
import { IProjectReactionStore } from "@/plane-web/store/projects/project-details/project_reaction.store";
// plane web stores

export const useProjectReactions = (): IProjectReactionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectDetails.reactionStore;
};
