import { ComputedDatum } from "@nivo/bar";
import { Theme } from "@nivo/core";
// components
import { TIssuePriorities } from "@plane/types";
import { BarGraph } from "@/components/ui";
// helpers
import { PRIORITY_GRAPH_GRADIENTS } from "@/constants/dashboard";
import { ISSUE_PRIORITIES } from "@/constants/issue";
import { capitalizeFirstLetter } from "@/helpers/string.helper";
// types
// constants

type Props = {
  borderRadius?: number;
  data: {
    priority: TIssuePriorities;
    priority_count: number;
  }[];
  height?: number;
  onBarClick?: (
    datum: ComputedDatum<any> & {
      color: string;
    }
  ) => void;
  padding?: number;
  theme?: Theme;
};

const PRIORITY_TEXT_COLORS = {
  urgent: "#CE2C31",
  high: "#AB4800",
  medium: "#AB6400",
  low: "#1F2D5C",
  none: "#60646C",
};

export const IssuesByPriorityGraph: React.FC<Props> = (props) => {
  const { borderRadius = 8, data, height = 300, onBarClick, padding = 0.05, theme } = props;

  const chartData = data.map((priority) => ({
    priority: capitalizeFirstLetter(priority.priority),
    value: priority.priority_count,
  }));

  return (
    <BarGraph
      data={chartData}
      height={`${height}px`}
      indexBy="priority"
      keys={["value"]}
      borderRadius={borderRadius}
      padding={padding}
      customYAxisTickValues={data.map((p) => p.priority_count)}
      axisBottom={{
        tickPadding: 8,
        tickSize: 0,
      }}
      tooltip={(datum) => (
        <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
          <span
            className="h-3 w-3 rounded"
            style={{
              backgroundColor: PRIORITY_TEXT_COLORS[`${datum.data.priority}`.toLowerCase() as TIssuePriorities],
            }}
          />
          <span className="font-medium text-custom-text-200">{datum.data.priority}:</span>
          <span>{datum.value}</span>
        </div>
      )}
      colors={({ data }) => `url(#gradient${data.priority})`}
      defs={PRIORITY_GRAPH_GRADIENTS}
      fill={ISSUE_PRIORITIES.map((p) => ({
        match: {
          id: p.key,
        },
        id: `gradient${p.title}`,
      }))}
      onClick={(datum) => {
        if (onBarClick) onBarClick(datum);
      }}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: "transparent",
            },
          },
          ticks: {
            text: {
              fontSize: 13,
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
