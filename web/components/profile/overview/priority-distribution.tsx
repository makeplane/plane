// components
import { IssuesByPriorityGraph } from "components/graphs";
// ui
import { ProfileEmptyState } from "components/ui";
import { Loader } from "@plane/ui";
// image
import emptyBarGraph from "public/empty-state/empty_bar_graph.svg";
// types
import { IUserPriorityDistribution } from "@plane/types";

type Props = {
  priorityDistribution: IUserPriorityDistribution[] | undefined;
};

export const ProfilePriorityDistribution: React.FC<Props> = (props) => {
  const { priorityDistribution } = props;

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-medium">Issues by Priority</h3>
      {priorityDistribution ? (
        <div className="flex-grow rounded border border-custom-border-100">
          {priorityDistribution.length > 0 ? (
            <IssuesByPriorityGraph data={priorityDistribution} />
          ) : (
            <div className="flex-grow p-7">
              <ProfileEmptyState
                title="No Data yet"
                description="Create issues to view the them by priority in the graph for better analysis."
                image={emptyBarGraph}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid place-items-center p-7">
          <Loader className="flex items-end gap-12">
            <Loader.Item width="30px" height="200px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="250px" />
            <Loader.Item width="30px" height="150px" />
            <Loader.Item width="30px" height="100px" />
          </Loader>
        </div>
      )}
    </div>
  );
};
