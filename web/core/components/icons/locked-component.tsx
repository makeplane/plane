import { Lock } from "lucide-react";
import { Tooltip } from "@plane/ui";

export const LockedComponent = (props: { toolTipContent?: string }) => {
  const { toolTipContent } = props;
  const lockedComponent = (
    <div className="flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
      <Lock className="h-3 w-3" />
      <span>Locked</span>
    </div>
  );

  return (
    <>
      {toolTipContent ? <Tooltip tooltipContent={toolTipContent}>{lockedComponent}</Tooltip> : <>{lockedComponent}</>}
    </>
  );
};
