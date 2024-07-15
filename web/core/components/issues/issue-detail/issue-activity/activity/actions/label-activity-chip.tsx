import { FC } from "react";
import { Tooltip } from "@plane/ui";

type TIssueLabelPill = { name?: string; color?: string };

export const LabelActivityChip: FC<TIssueLabelPill> = (props) => {
  const { name, color } = props;
  return (
    <Tooltip tooltipContent={name}>
      <span className="inline-flex w-min max-w-32 cursor-default flex-shrink-0 items-center gap-2 truncate whitespace-nowrap rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: color ?? "#000000",
          }}
          aria-hidden="true"
        />
        <span className="flex-shrink truncate font-medium text-custom-text-100">{name}</span>
      </span>
    </Tooltip>
  );
};
