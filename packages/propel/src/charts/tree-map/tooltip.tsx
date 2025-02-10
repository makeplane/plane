import React from "react";
// plane imports
import { Card, ECardSpacing } from "@plane/ui";

interface TreeMapTooltipProps {
  active: boolean | undefined;
  payload: any[] | undefined;
}

export const TreeMapTooltip = React.memo(({ active, payload }: TreeMapTooltipProps) => {
  if (!active || !payload || !payload[0]?.payload) return null;

  const data = payload[0].payload;

  return (
    <Card className="flex flex-col space-y-1.5" spacing={ECardSpacing.SM}>
      <div className="flex items-center gap-2 border-b border-custom-border-200 pb-2.5">
        {data?.icon}
        <p className="text-xs text-custom-text-100 font-medium capitalize">{data?.name}</p>
      </div>
      <span className="text-xs font-medium text-custom-text-200">
        {data?.value.toLocaleString()}
        {data.label && ` ${data.label}`}
      </span>
    </Card>
  );
});

TreeMapTooltip.displayName = "TreeMapTooltip";
