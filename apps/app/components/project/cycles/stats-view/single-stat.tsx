// next
import Link from "next/link";
// swr
import useSWR from "swr";
// services
import cyclesService from "lib/services/cycles.service";
// hooks
import useUser from "lib/hooks/useUser";
// types
import { CycleIssueResponse, ICycle } from "types";
// fetch-keys
import { CYCLE_ISSUES } from "constants/fetch-keys";
import { groupBy, renderShortNumericDateFormat } from "constants/common";
import {
  CheckIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type Props = { cycle: ICycle };

const stateGroupIcons: {
  [key: string]: JSX.Element;
} = {
  backlog: <ExclamationTriangleIcon className="h-4 w-4" />,
  unstarted: <CheckIcon className="h-4 w-4" />,
  started: <CheckIcon className="h-4 w-4" />,
  cancelled: <ExclamationCircleIcon className="h-4 w-4" />,
  completed: <CheckIcon className="h-4 w-4" />,
};

const SingleStat: React.FC<Props> = ({ cycle }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    activeWorkspace && activeProject && cycle.id ? CYCLE_ISSUES(cycle.id as string) : null,
    activeWorkspace && activeProject && cycle.id
      ? () =>
          cyclesService.getCycleIssues(activeWorkspace?.slug, activeProject?.id, cycle.id as string)
      : null
  );
  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_details.state_detail.group"),
  };

  // status calculator
  const startDate = new Date(cycle.start_date ?? "");
  const endDate = new Date(cycle.end_date ?? "");
  const today = new Date();

  return (
    <>
      <div className="bg-white p-3">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Link href={`/projects/${activeProject?.id}/cycles/${cycle.id}`}>
              <a className="block rounded-md">{cycle.name}</a>
            </Link>
            <div className="text-xs text-gray-500">
              <span>{renderShortNumericDateFormat(startDate)}</span>
              {" - "}
              <span>{renderShortNumericDateFormat(endDate)}</span>
            </div>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
            {today.getDate() < startDate.getDate()
              ? "Not started"
              : today.getDate() > endDate.getDate()
              ? "Over"
              : "Active"}
          </div>
        </div>
        <div className="text-sm mt-6 mb-4 space-y-2">
          <div className="grid grid-cols-5 gap-4">
            {Object.keys(groupedIssues).map((group) => {
              return (
                <div key={group} className="bg-gray-100 rounded-md p-3 flex items-center gap-3">
                  <div>
                    <div className="h-8 w-8 rounded-full grid place-items-center bg-green-500 text-white">
                      {stateGroupIcons[group]}
                    </div>
                  </div>
                  <div>
                    <h5 className="capitalize">{group}</h5>
                    <span>{groupedIssues[group].length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default SingleStat;
