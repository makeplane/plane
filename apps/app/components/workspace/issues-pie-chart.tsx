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
    <div className="rounded-[10px] border border-custom-border-100 bg-custom-background-100 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-4">
        <div className="sm:col-span-3">
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
            innerRadius={0.6}
            cornerRadius={5}
            padAngle={2}
            enableArcLabels
            arcLabelsTextColor="#000000"
            enableArcLinkLabels={false}
            activeInnerRadiusOffset={5}
            colors={(datum) => datum.data.color}
            tooltip={(datum) => (
              <div className="flex items-center gap-2 rounded-md border border-custom-border-100 bg-custom-background-80 p-2 text-xs">
                <span className="text-custom-text-200 capitalize">{datum.datum.label} issues:</span>{" "}
                {datum.datum.value}
              </div>
            )}
            margin={{
              top: 32,
              right: 0,
              bottom: 32,
              left: 0,
            }}
            theme={{
              background: "transparent",
            }}
          />
        </div>
        <div className="flex sm:block items-center gap-3 flex-wrap justify-center sm:space-y-2 sm:self-end sm:justify-self-end sm:px-8 sm:pb-8">
          {groupedIssues?.map((cell) => (
            <div key={cell.state_group} className="flex items-center gap-2">
              <div
                className="h-2 w-2"
                style={{ backgroundColor: STATE_GROUP_COLORS[cell.state_group] }}
              />
              <div className="capitalize text-custom-text-200 text-xs">
                {cell.state_group}- {cell.state_count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
