import { useContext } from "react";
// context
import {
  ProjectCreationContext,
  TProjectCreationContext,
} from "@/plane-web/components/projects/create/project-creation-context";

export const useProjectCreation = (): TProjectCreationContext => {
  const context = useContext(ProjectCreationContext);
  if (context === undefined) throw new Error("useProjectCreation must be used within ProjectCreationProvider");
  return context;
};
