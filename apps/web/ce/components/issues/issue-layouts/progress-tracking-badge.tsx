import { Tooltip } from "@plane/propel/tooltip";
import { getProgressStatus } from "./progress-tracking-utils";

type Props = { targetDate: string | null | undefined };

export function ProgressTrackingBadge({ targetDate }: Props): JSX.Element | null {
  const progressStatus = getProgressStatus(targetDate ?? null);
  if (!progressStatus) return null;

  const { label, className, bgClassName } = progressStatus;

  return (
    <Tooltip tooltipContent={label}>
      <div
        className={`flex h-5 flex-shrink-0 items-center overflow-hidden rounded-sm border-[0.5px] px-2.5 py-1 ${bgClassName}`}
      >
        <span className={`text-caption-sm-regular ${className}`}>{label}</span>
      </div>
    </Tooltip>
  );
}
