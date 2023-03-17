// components
import { ActivityGraph } from "components/workspace";
// helpers
import { groupBy } from "helpers/array.helper";
// types
import { IIssue } from "types";

type Props = {
  issues: IIssue[] | undefined;
};

export const IssuesStats: React.FC<Props> = ({ issues }) => {
  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(issues ?? [], "state_detail.group"),
  };

  return (
    <div className="grid grid-cols-1 rounded-[10px] border bg-white lg:grid-cols-3">
      {issues ? (
        <>
          <div className="grid grid-cols-2 gap-4 border-b p-4 lg:border-r lg:border-b-0">
            <div className="pb-4">
              <h4>Issues assigned to you</h4>
              <h5 className="mt-2 text-2xl font-semibold">{issues.length}</h5>
            </div>
            <div className="pb-4">
              <h4>Pending issues</h4>
              <h5 className="mt-2 text-2xl font-semibold">
                {issues.length - groupedIssues.completed.length}
              </h5>
            </div>
            <div className="pb-4">
              <h4>Completed issues</h4>
              <h5 className="mt-2 text-2xl font-semibold">{groupedIssues.completed.length}</h5>
            </div>
            <div className="pb-4">
              <h4>Issues due by this week</h4>
              <h5 className="mt-2 text-2xl font-semibold">24</h5>
            </div>
          </div>
          <div className="p-4 lg:col-span-2">
            <h3 className="mb-2 font-semibold capitalize">Activity Graph</h3>
            <ActivityGraph />
          </div>
        </>
      ) : null}
    </div>
  );
};
