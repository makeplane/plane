// ui
import { CalendarGraph } from "components/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IUserActivity } from "types";

type Props = {
  activities: IUserActivity[] | undefined;
};

export const ActivityGraph: React.FC<Props> = ({ activities }) => (
  <CalendarGraph
    data={
      activities?.map((activity) => ({
        day: activity.created_date,
        value: activity.activity_count,
      })) ?? []
    }
    from={activities?.length ? activities[0].created_date : new Date()}
    to={activities?.length ? activities[activities.length - 1].created_date : new Date()}
    height="200px"
    margin={{ bottom: 0, left: 10, right: 10, top: 0 }}
    tooltip={(datum) => (
      <div className="rounded-md border border-brand-base bg-brand-surface-2 p-2 text-xs">
        <span className="text-brand-secondary">{renderShortDateWithYearFormat(datum.day)}:</span>{" "}
        {datum.value}
      </div>
    )}
    theme={{
      background: "rgb(var(--color-bg-base))",
    }}
  />
);
