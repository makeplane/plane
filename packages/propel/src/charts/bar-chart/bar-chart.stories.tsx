import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "./root";

const sampleData = [
  { month: "Jan", workitems: 100, completed: 40 },
  { month: "Feb", workitems: 200, completed: 80 },
  { month: "Mar", workitems: 150, completed: 60 },
  { month: "Apr", workitems: 300, completed: 120 },
  { month: "May", workitems: 250, completed: 100 },
  { month: "Jun", workitems: 400, completed: 160 },
];

const baseArgs = {
  data: sampleData,
  xAxis: { key: "month", label: "Month" },
  yAxis: { key: "workitems", label: "Workitems", allowDecimals: false },
  className: "h-[400px] w-[600px]",
};

const meta: Meta<typeof BarChart> = {
  title: "Charts/BarChart",
  component: BarChart,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- STORIES ---------- */

export const Default: Story = {
  args: {
    ...baseArgs,
    bars: [
      {
        key: "workitems",
        label: "Workitems",
        fill: "#3B82F6",
        textClassName: "text-blue-500",
        stackId: "workitems",
      },
    ],
  },
};

export const MultiBarChart: Story = {
  args: {
    ...baseArgs,
    yAxis: { ...baseArgs.yAxis, label: "Amount" },
    bars: [
      {
        key: "workitems",
        label: "Workitems",
        fill: "#3B82F6",
        textClassName: "text-blue-500",
        stackId: "group",
      },
      {
        key: "completed",
        label: "Completed",
        fill: "#10B981",
        textClassName: "text-green-500",
        stackId: "group",
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "top",
      layout: "horizontal",
    },
  },
};

export const LollipopChart: Story = {
  args: {
    ...baseArgs,
    bars: [
      {
        key: "workitems",
        label: "Workitems",
        fill: "#3B82F6",
        textClassName: "text-blue-500",
        stackId: "workitems",
        shapeVariant: "lollipop",
      },
    ],
  },
};

export const DottedLollipopChart: Story = {
  args: {
    ...LollipopChart.args,
    bars: LollipopChart.args?.bars
      ? LollipopChart.args.bars.map((bar) => ({
          ...bar,
          shapeVariant: "lollipop-dotted",
        }))
      : [],
  },
};

export const WithCustomTooltip: Story = {
  args: {
    ...Default.args,
    customTooltipContent: ({ active, label, payload }) =>
      active && payload ? (
        <div className="rounded-md bg-white p-2 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any) => (
            <p key={item.name} style={{ color: item.fill }}>
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      ) : null,
  },
};

export const WithCustomTicks: Story = {
  args: {
    ...Default.args,
    customTicks: {
      x: (props: any) => (
        <text {...props} dy={16} textAnchor="middle" fill="#666">
          {props.payload.value}
        </text>
      ),
      y: (props: any) => (
        <text {...props} dx={-10} textAnchor="end" fill="#666">
          ${props.payload.value}
        </text>
      ),
    },
  },
};
