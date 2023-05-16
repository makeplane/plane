// types
import { IUserStateDistribution } from "types";
// helper
import { capitalizeFirstLetter } from "helpers/string.helper";
// constants
import { CHARTS_THEME } from "constants/graph";
import { STATE_GROUP_COLORS } from "constants/state";
// components
import { PieGraph } from "components/ui";

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
            // TODO: convert hex to hsl
            color: STATE_GROUP_COLORS[cell.state_group.toLowerCase()],
          })) ?? []
        }
        height="320px"
        innerRadius={0.5}
        arcLinkLabel={(cell) => `${capitalizeFirstLetter(cell.label.toString())} (${cell.value})`}
        legends={
          groupedIssues?.map((cell) => ({
            data: [
              {
                id: cell.state_group,
                label: capitalizeFirstLetter(cell.state_group),
                value: cell.state_count,
                color: STATE_GROUP_COLORS[cell.state_group.toLowerCase()],
              },
            ],

            direction: "column",
            itemHeight: 20,
            itemWidth: 100,
            anchor: "right",
          })) ?? []
        }
        activeInnerRadiusOffset={5}
        theme={{
          ...CHARTS_THEME,
          background: "rgb(var(--color-bg-base))",
        }}
      />
    </div>
  </div>
);
