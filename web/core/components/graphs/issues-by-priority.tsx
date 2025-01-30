import { ComputedDatum } from "@nivo/bar";
import { Theme, linearGradientDef } from "@nivo/core";
import { ISSUE_PRIORITIES } from "@plane/constants";
// components
import { TIssuePriorities } from "@plane/types";
import { BarGraph } from "@/components/ui";
// helpers
import { capitalizeFirstLetter } from "@/helpers/string.helper";

// gradients for work items by priority widget graph bars
export const PRIORITY_GRAPH_GRADIENTS = [
  linearGradientDef(
    "gradient_urgent",
    [
      { offset: 0, color: "#A90408" },
      { offset: 100, color: "#DF4D51" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradient_high",
    [
      { offset: 0, color: "#FE6B00" },
      { offset: 100, color: "#FFAC88" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradient_medium",
    [
      { offset: 0, color: "#F5AC00" },
      { offset: 100, color: "#FFD675" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradient_low",
    [
      { offset: 0, color: "#1B46DE" },
      { offset: 100, color: "#4F9BF4" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradient_none",
    [
      { offset: 0, color: "#A0A1A9" },
      { offset: 100, color: "#B9BBC6" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
];

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
        id: `gradient_${p.key}`,
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
