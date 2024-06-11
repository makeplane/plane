// components
import { IUserPriorityDistribution } from "@plane/types";
import { IssuesByPriorityGraph } from "@/components/graphs";
import { ProfileEmptyState } from "@/components/ui";
// assets
import emptyBarGraph from "@/public/empty-state/empty_bar_graph.svg";
// types

type Props = {
  priorityDistribution: IUserPriorityDistribution[];
};

export const PriorityDistributionContent: React.FC<Props> = (props) => {
  const { priorityDistribution } = props;

  return (
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
  );
};
