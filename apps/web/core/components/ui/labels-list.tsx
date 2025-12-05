// ui
import { Tooltip } from "@plane/propel/tooltip";
import type { IIssueLabel } from "@plane/types";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// hooks

type IssueLabelsListProps = {
  labels?: (IIssueLabel | undefined)[];
  length?: number;
  showLength?: boolean;
};

export function IssueLabelsList(props: IssueLabelsListProps) {
  const { labels } = props;
  const { isMobile } = usePlatformOS();
  return (
    <>
      {labels && (
        <>
          <Tooltip
            position="top"
            tooltipHeading="Labels"
            tooltipContent={labels.map((l) => l?.name).join(", ")}
            isMobile={isMobile}
          >
            <div className="h-full flex items-center gap-1 rounded-sm border-[0.5px] border-strong px-2 py-1 text-11 text-secondary">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
              <span>{labels.length}</span>
              <span> Labels</span>
            </div>
          </Tooltip>
        </>
      )}
    </>
  );
}
