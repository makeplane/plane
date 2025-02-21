import { observer } from "mobx-react";
// ce components
import {
  IssueLevelModals as BaseIssueLevelModals,
  TIssueLevelModalsProps,
} from "@/ce/components/command-palette/modals/issue-level";

export const IssueLevelModals = observer((props: TIssueLevelModalsProps) => (
  <>
    <BaseIssueLevelModals {...props} />
  </>
));
