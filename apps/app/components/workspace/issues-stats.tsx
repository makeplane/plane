// components
import { Loader } from "components/ui";
import { ActivityGraph } from "components/workspace";
// helpers
import { groupBy } from "helpers/array.helper";
// types
import { IUserWorkspaceDashboard } from "types";

type Props = {
  data: IUserWorkspaceDashboard | undefined;
};

export const IssuesStats: React.FC<Props> = ({ data }) => (
  <div className="grid grid-cols-1 rounded-[10px] border bg-white lg:grid-cols-3">
    <div className="grid grid-cols-2 gap-4 border-b p-4 lg:border-r lg:border-b-0">
      <div className="pb-4">
        <h4>Issues assigned to you</h4>
        <h5 className="mt-2 text-2xl font-semibold">
          {data ? (
            data.assigned_issues_count
          ) : (
            <Loader>
              <Loader.Item height="25px" width="50%" />
            </Loader>
          )}
        </h5>
      </div>
      <div className="pb-4">
        <h4>Pending issues</h4>
        <h5 className="mt-2 text-2xl font-semibold">
          {data ? (
            data.pending_issues_count
          ) : (
            <Loader>
              <Loader.Item height="25px" width="50%" />
            </Loader>
          )}
        </h5>
      </div>
      <div className="pb-4">
        <h4>Completed issues</h4>
        <h5 className="mt-2 text-2xl font-semibold">
          {data ? (
            data.completed_issues_count
          ) : (
            <Loader>
              <Loader.Item height="25px" width="50%" />
            </Loader>
          )}
        </h5>
      </div>
      <div className="pb-4">
        <h4>Issues due by this week</h4>
        <h5 className="mt-2 text-2xl font-semibold">
          {data ? (
            data.issues_due_week_count
          ) : (
            <Loader>
              <Loader.Item height="25px" width="50%" />
            </Loader>
          )}
        </h5>
      </div>
    </div>
    <div className="p-4 lg:col-span-2">
      <h3 className="mb-2 font-semibold capitalize">Activity Graph</h3>
      <ActivityGraph activities={data?.issue_activities} />
    </div>
  </div>
);
