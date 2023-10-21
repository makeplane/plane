// ui
import { BarGraph, ProfileEmptyState } from "components/ui";
import { Loader } from "@plane/ui";
// image
import emptyBarGraph from "public/empty-state/empty_bar_graph.svg";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IUserProfileData } from "types";

type Props = {
  userProfile: IUserProfileData | undefined;
};

export const ProfilePriorityDistribution: React.FC<Props> = ({ userProfile }) => (
  <div className="flex flex-col space-y-2">
    <h3 className="text-lg font-medium">Issues by Priority</h3>
    {userProfile ? (
      <div className="flex-grow border border-custom-border-100 rounded">
        {userProfile.priority_distribution.length > 0 ? (
          <BarGraph
            data={userProfile.priority_distribution.map((priority) => ({
              priority: capitalizeFirstLetter(priority.priority ?? "None"),
              value: priority.priority_count,
            }))}
            height="300px"
            indexBy="priority"
            keys={["value"]}
            borderRadius={4}
            padding={0.7}
            customYAxisTickValues={userProfile.priority_distribution.map((p) => p.priority_count)}
            tooltip={(datum) => (
              <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
                <span
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: datum.color,
                  }}
                />
                <span className="font-medium text-custom-text-200">{datum.data.priority}:</span>
                <span>{datum.value}</span>
              </div>
            )}
            colors={(datum) => {
              if (datum.data.priority === "Urgent") return "#991b1b";
              else if (datum.data.priority === "High") return "#ef4444";
              else if (datum.data.priority === "Medium") return "#f59e0b";
              else if (datum.data.priority === "Low") return "#16a34a";
              else return "#e5e5e5";
            }}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: "transparent",
                  },
                },
              },
              grid: {
                line: {
                  stroke: "transparent",
                },
              },
            }}
          />
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
