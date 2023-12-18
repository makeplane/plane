import { useEffect, useRef, useState } from "react";

// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderDateFormat, renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IUserActivity } from "types";
// constants
import { DAYS, MONTHS } from "constants/project";

type Props = {
  activities: IUserActivity[] | undefined;
};

export const ActivityGraph: React.FC<Props> = ({ activities }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const fourMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 4, 1);
  const fiveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const recentMonths = [fiveMonthsAgo, fourMonthsAgo, threeMonthsAgo, twoMonthsAgo, lastMonth, today];

  const getDatesOfMonth = (dateOfMonth: Date) => {
    const month = dateOfMonth.getMonth();
    const year = dateOfMonth.getFullYear();

    const dates = [];
    const date = new Date(year, month, 1);

    while (date.getMonth() === month && date < new Date()) {
      dates.push(renderDateFormat(new Date(date)));
      date.setDate(date.getDate() + 1);
    }

    return dates;
  };

  const recentDates = [
    ...getDatesOfMonth(recentMonths[0]),
    ...getDatesOfMonth(recentMonths[1]),
    ...getDatesOfMonth(recentMonths[2]),
    ...getDatesOfMonth(recentMonths[3]),
    ...getDatesOfMonth(recentMonths[4]),
    ...getDatesOfMonth(recentMonths[5]),
  ];

  const activitiesIntensity = (activityCount: number) => {
    if (activityCount <= 3) return "opacity-20";
    else if (activityCount > 3 && activityCount <= 6) return "opacity-40";
    else if (activityCount > 6 && activityCount <= 9) return "opacity-80";
    else return "";
  };

  const addPaddingTiles = () => {
    const firstDateDay = new Date(recentDates[0]).getDay();

    for (let i = 0; i < firstDateDay; i++) recentDates.unshift("");
  };
  addPaddingTiles();

  useEffect(() => {
    if (!ref.current) return;

    setWidth(ref.current.offsetWidth);
  }, [ref]);

  return (
    <div className="grid place-items-center overflow-x-scroll">
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-2 pt-6">
          {DAYS.map((day, index) => (
            <h6 key={day} className="h-4 text-xs">
              {index % 2 === 0 && day.substring(0, 3)}
            </h6>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between" style={{ width: `${width}px` }}>
            {recentMonths.map((month, index) => (
              <h6 key={index} className="w-full text-xs">
                {MONTHS[month.getMonth()].substring(0, 3)}
              </h6>
            ))}
          </div>
          <div
            className="mt-2 grid w-full grid-flow-col gap-2"
            style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
            ref={ref}
          >
            {recentDates.map((date, index) => {
              const isActive = activities?.find((a) => a.created_date === date);

              return (
                <Tooltip
                  key={`${date}-${index}`}
                  tooltipContent={`${
                    isActive ? isActive.activity_count : 0
                  } activities on ${renderShortDateWithYearFormat(date)}`}
                >
                  <div
                    className={`${date === "" ? "pointer-events-none opacity-0" : ""} h-4 w-4 rounded ${
                      isActive
                        ? `bg-custom-primary ${activitiesIntensity(isActive.activity_count)}`
                        : "bg-custom-background-80"
                    }`}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs">
            <span>Less</span>
            <span className="h-4 w-4 rounded bg-custom-background-80" />
            <span className="h-4 w-4 rounded bg-custom-primary opacity-20" />
            <span className="h-4 w-4 rounded bg-custom-primary opacity-40" />
            <span className="h-4 w-4 rounded bg-custom-primary opacity-80" />
            <span className="h-4 w-4 rounded bg-custom-primary" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
