// icons
import {
  ModuleBacklogIcon,
  ModuleCancelledIcon,
  ModuleCompletedIcon,
  ModuleInProgressIcon,
  ModulePausedIcon,
  ModulePlannedIcon,
} from "components/icons";
// types
import { TModuleStatus } from "@plane/types";

type Props = {
  status: TModuleStatus;
  className?: string;
  height?: string;
  width?: string;
};

export const ModuleStatusIcon: React.FC<Props> = ({ status, className, height = "12px", width = "12px" }) => {
  if (status === "backlog") return <ModuleBacklogIcon className={className} height={height} width={width} />;
  else if (status === "cancelled") return <ModuleCancelledIcon className={className} height={height} width={width} />;
  else if (status === "completed") return <ModuleCompletedIcon className={className} height={height} width={width} />;
  else if (status === "in-progress")
    return <ModuleInProgressIcon className={className} height={height} width={width} />;
  else if (status === "paused") return <ModulePausedIcon className={className} height={height} width={width} />;
  else return <ModulePlannedIcon className={className} height={height} width={width} />;
};
