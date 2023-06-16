// ui
import { PieGraph } from "components/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IUserStateDistribution } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  groupedIssues: IUserStateDistribution[] | undefined;
};

export const IssuesPieChart: React.FC<Props> = ({ groupedIssues }) => (
  <div>
    <h3 className="mb-2 font-semibold">Issues by States</h3>
    <div className="rounded-[10px] border border-brand-base bg-brand-base p-4">
      <PieGraph
        data={
          groupedIssues?.map((cell) => ({
            id: cell.state_group,
            label: cell.state_group,
            value: cell.state_count,
            color: STATE_GROUP_COLORS[cell.state_group.toLowerCase()],
          })) ?? []
        }
        height="320px"
        innerRadius={0.5}
        arcLinkLabel={(cell) => `${capitalizeFirstLetter(cell.label.toString())} (${cell.value})`}
        legends={[
          {
            anchor: "right",
            direction: "column",
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 10,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: "rgb(var(--color-text-secondary))",
            itemDirection: "left-to-right",
            itemOpacity: 1,
            symbolSize: 12,
            symbolShape: "square",
            data:
              groupedIssues?.map((cell) => ({
                id: cell.state_group,
                label: capitalizeFirstLetter(cell.state_group),
                value: cell.state_count,
                color: STATE_GROUP_COLORS[cell.state_group.toLowerCase()],
              })) ?? [],
          },
        ]}
        activeInnerRadiusOffset={5}
        colors={(datum) => datum.data.color}
        theme={{
          background: "rgb(var(--color-bg-base))",
        }}
      />
    </div>
  </div>
);
