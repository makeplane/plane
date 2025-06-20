import { Lock, Globe2 } from "lucide-react";
// plane imports
import { TNetworkChoiceIconKey } from "@plane/constants";
import { cn } from "@plane/utils";

type Props = {
  iconKey: TNetworkChoiceIconKey;
  className?: string;
};

export const ProjectNetworkIcon = (props: Props) => {
  const { iconKey, className } = props;
  // Get the icon key
  const getProjectNetworkIcon = () => {
    switch (iconKey) {
      case "Lock":
        return Lock;
      case "Globe2":
        return Globe2;
      default:
        return null;
    }
  };

  // Get the icon
  const Icon = getProjectNetworkIcon();
  if (!Icon) return null;

  return <Icon className={cn("h-3 w-3", className)} />;
};
