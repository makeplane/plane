import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { ICycle } from "types";

export const CycleGanttBlock = ({ cycle }: { cycle: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${cycle.project}/cycles/${cycle.id}`}>
      <a className="relative flex items-center w-full h-full shadow-sm transition-all duration-300">
        <div className="flex-shrink-0 w-0.5 h-full bg-custom-primary-100" />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{cycle.name}</h5>
              <div>
                {renderShortDate(cycle.start_date ?? "")} to {renderShortDate(cycle.end_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {cycle.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};

export const CycleGanttSidebarBlock = ({ cycle }: { cycle: ICycle }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${cycle?.project}/issues/${cycle?.id}`}>
      <a className="relative w-full flex items-center gap-2 h-full">
        <h6 className="text-sm font-medium flex-grow truncate">{cycle?.name}</h6>
      </a>
    </Link>
  );
};
