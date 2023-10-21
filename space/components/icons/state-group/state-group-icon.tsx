// icons
import {
  BacklogStateIcon,
  CancelledStateIcon,
  CompletedStateIcon,
  StartedStateIcon,
  UnstartedStateIcon,
} from "components/icons";
import { TIssueGroupKey } from "types/issue";

type Props = {
  stateGroup: TIssueGroupKey;
  color: string;
  className?: string;
  height?: string;
  width?: string;
};

export const StateGroupIcon: React.FC<Props> = ({ stateGroup, className, color, height = "12px", width = "12px" }) => {
  if (stateGroup === "backlog")
    return <BacklogStateIcon className={className} color={color} height={height} width={width} />;
  else if (stateGroup === "cancelled")
    return <CancelledStateIcon className={className} color={color} height={height} width={width} />;
  else if (stateGroup === "completed")
    return <CompletedStateIcon className={className} color={color} height={height} width={width} />;
  else if (stateGroup === "started")
    return <StartedStateIcon className={className} color={color} height={height} width={width} />;
  else return <UnstartedStateIcon className={className} color={color} height={height} width={width} />;
};
