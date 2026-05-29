import type { ReactNode } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import type { TDropdownProps } from "../types";
import { ProjectDropdownBase } from "./base";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onClose?: () => void;
  renderCondition?: (projectId: string) => boolean;
  renderByDefault?: boolean;
  currentProjectId?: string;
} & (
    | {
        multiple: false;
        onChange: (val: string) => void;
        value: string | null;
      }
    | {
        multiple: true;
        onChange: (val: string[]) => void;
        value: string[];
      }
  );

export const ProjectDropdown = observer(function ProjectDropdown(props: Props) {
  // store hooks
  const { joinedProjectIds, getProjectById } = useProject();

  return <ProjectDropdownBase {...props} getProjectById={getProjectById} projectIds={joinedProjectIds} />;
});
