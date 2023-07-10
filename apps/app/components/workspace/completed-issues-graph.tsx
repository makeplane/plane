// ui
import { CustomMenu, LineGraph } from "components/ui";
// constants
import { MONTHS } from "constants/project";

type Props = {
  issues:
    | {
        week_in_month: number;
        completed_count: number;
      }[]
    | undefined;
  month: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
};

export const CompletedIssuesGraph: React.FC<Props> = ({ month, issues, setMonth }) => {
  const weeks = month === 2 ? 4 : 5;

  const data: any[] = [];

  for (let i = 1; i <= weeks; i++) {
    data.push({
      week_in_month: `Week ${i}`,
      completed_count: issues?.find((item) => item.week_in_month === i)?.completed_count ?? 0,
    });
  }

  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <h3 className="font-semibold">Issues closed by you</h3>
        <CustomMenu label={<span className="text-sm">{MONTHS[month - 1]}</span>} noBorder>
          {MONTHS.map((month, index) => (
            <CustomMenu.MenuItem key={month} onClick={() => setMonth(index + 1)}>
              {month}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
      <div className="rounded-[10px] border border-custom-border-100 bg-custom-background-100 p-8 pl-4">
        {data.every((item) => item.completed_count === 0) ? (
          <div className="flex items-center justify-center h-72">
            <h4 className="text-[#d687ff]">No issues closed this month</h4>
          </div>
        ) : (
          <>
            <LineGraph
              height="250px"
              data={[
                {
                  id: "completed_issues",
                  color: "#d687ff",
                  data: data.map((item) => ({
                    x: item.week_in_month,
                    y: item.completed_count,
                  })),
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              customYAxisTickValues={data.map((item) => item.completed_count)}
              colors={(datum) => datum.color}
              enableSlices="x"
              sliceTooltip={(datum) => (
                <div className="rounded-md border border-custom-border-100 bg-custom-background-80 p-2 text-xs">
                  {datum.slice.points[0].data.yFormatted}
                  <span className="text-custom-text-200"> issues closed in </span>
                  {datum.slice.points[0].data.xFormatted}
                </div>
              )}
              theme={{
                background: "rgb(var(--color-background-100))",
              }}
            />
            <h4 className="mt-4 flex items-center justify-center gap-2 text-[#d687ff]">
              <span className="h-2 w-2 bg-[#d687ff]" />
              Completed Issues
            </h4>
          </>
        )}
      </div>
    </div>
  );
};
