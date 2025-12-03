import { Globe2 } from "lucide-react";
// plane imports
import type { TNetworkChoiceIconKey } from "@plane/constants";
import { LockIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  iconKey: TNetworkChoiceIconKey;
  className?: string;
};

export function ProjectNetworkIcon(props: Props) {
  const { iconKey, className } = props;
  // Get the icon key
  const getProjectNetworkIcon = () => {
    switch (iconKey) {
      case "Lock":
        return LockIcon;
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
}
