import { Theme } from "@nivo/core";
// components
import { BarGraph } from "components/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { TIssuePriorities } from "@plane/types";

type Props = {
  data: {
    priority: TIssuePriorities;
    priority_count: number;
  }[];
  height?: number;
  theme?: Theme;
};

export const IssuesByPriorityGraph: React.FC<Props> = (props) => {
  const { data, height = 300, theme } = props;

  return (
    <BarGraph
      data={data.map((priority) => ({
        priority: capitalizeFirstLetter(priority.priority ?? "None"),
        value: priority.priority_count,
      }))}
      height={`${height}px`}
      indexBy="priority"
      keys={["value"]}
      borderRadius={4}
      padding={0.7}
      customYAxisTickValues={data.map((p) => p.priority_count)}
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
        ...theme,
      }}
    />
  );
};
