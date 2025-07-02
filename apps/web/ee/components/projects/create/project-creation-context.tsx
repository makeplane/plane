import { createContext } from "react";
// react-hook-form
import { UseFormReset } from "react-hook-form";
// plane imports
import { TProject } from "@plane/types";

export type THandleTemplateChangeProps = {
  workspaceSlug: string;
  reset: UseFormReset<TProject>;
};

export type TProjectCreationContext = {
  projectTemplateId: string | null;
  setProjectTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
  isApplyingTemplate: boolean;
  setIsApplyingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  handleTemplateChange: (props: THandleTemplateChangeProps) => Promise<void>;
};

export const ProjectCreationContext = createContext<TProjectCreationContext | undefined>(undefined);
