import { observer } from "mobx-react";
// ce components
import {
  WorkspaceLevelModals as BaseWorkspaceLevelModals,
  TWorkspaceLevelModalsProps,
} from "@/ce/components/command-palette/modals/workspace-level";

export const WorkspaceLevelModals = observer((props: TWorkspaceLevelModalsProps) => (
  <>
    <BaseWorkspaceLevelModals {...props} />
  </>
));
