import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { Tooltip } from "components/ui";
// helpers
import { renderShortDate } from "helpers/date-time.helper";
// types
import { ICycle, IIssue, IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

export const IssueGanttBlock = ({ issue }: { issue: IIssue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
      <a className="relative flex items-center w-full h-full shadow-sm transition-all duration-300">
        <div
          className="flex-shrink-0 w-0.5 h-full"
          style={{ backgroundColor: issue.state_detail?.color }}
        />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{issue.name}</h5>
              <div>
                {renderShortDate(issue.start_date ?? "")} to{" "}
                {renderShortDate(issue.target_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {issue.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};

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

export const ModuleGanttBlock = ({ module }: { module: IModule }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
      <a className="relative flex items-center w-full h-full shadow-sm transition-all duration-300">
        <div
          className="flex-shrink-0 w-0.5 h-full"
          style={{ backgroundColor: MODULE_STATUS.find((s) => s.value === module.status)?.color }}
        />
        <Tooltip
          tooltipContent={
            <div className="space-y-1">
              <h5>{module.name}</h5>
              <div>
                {renderShortDate(module.start_date ?? "")} to{" "}
                {renderShortDate(module.target_date ?? "")}
              </div>
            </div>
          }
          position="top-left"
        >
          <div className="text-custom-text-100 text-sm truncate py-1 px-2.5 w-full">
            {module.name}
          </div>
        </Tooltip>
      </a>
    </Link>
  );
};
