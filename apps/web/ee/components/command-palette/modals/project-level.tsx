import { observer } from "mobx-react";
// ce components
import {
  ProjectLevelModals as BaseProjectLevelModals,
  TProjectLevelModalsProps,
} from "@/ce/components/command-palette/modals/project-level";

export const ProjectLevelModals = observer((props: TProjectLevelModalsProps) => (
  <>
    <BaseProjectLevelModals {...props} />
  </>
));
