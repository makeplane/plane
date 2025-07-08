import { ReactNode } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store";
// local imports
import { TDropdownProps } from "../types";
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

export const ProjectDropdown: React.FC<Props> = observer((props) => {
  // store hooks
  const { joinedProjectIds, getProjectById } = useProject();

  return <ProjectDropdownBase {...props} getProjectById={getProjectById} projectIds={joinedProjectIds} />;
});
