import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import userService from "services/user.service";
// ui
import { Tooltip } from "components/ui";
// helpers
import { renderDateFormat, renderShortNumericDateFormat } from "helpers/date-time.helper";
// fetch-keys
import { USER_ACTIVITY } from "constants/fetch-keys";
// constants
import { DAYS, MONTHS } from "constants/project";

export const ActivityGraph = () => {
  const ref = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: userActivity } = useSWR(
    workspaceSlug ? USER_ACTIVITY(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userActivity(workspaceSlug as string) : null
  );

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const fourMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 4, 1);
  const fiveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const recentMonths = [
    fiveMonthsAgo,
    fourMonthsAgo,
    threeMonthsAgo,
    twoMonthsAgo,
    lastMonth,
    today,
  ];

  const getDatesOfMonth = (dateOfMonth: Date) => {
    const month = dateOfMonth.getMonth();
    const year = dateOfMonth.getFullYear();

    const dates = [];
    const date = new Date(year, month, 1);

    while (date.getMonth() === month && date < new Date()) {
      dates.push(new Date(date));
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

  const getDatesOnDay = (dates: Date[], day: number) => {
    const datesOnDay = [];

    for (let i = 0; i < dates.length; i++)
      if (dates[i].getDay() === day) datesOnDay.push(renderDateFormat(new Date(dates[i])));

    return datesOnDay;
  };

  const activitiesIntensity = (activityCount: number) => {
    if (activityCount <= 3) return "opacity-50";
    else if (activityCount > 3 && activityCount <= 6) return "opacity-70";
    else if (activityCount > 6 && activityCount <= 9) return "opacity-90";
    else return "";
  };

  useEffect(() => {
    if (!ref.current) return;

    setWidth(ref.current.offsetWidth);
  }, [ref]);

  return (
    <div className="grid place-items-center">
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-2 pt-6">
          {DAYS.map((day, index) => (
            <h6 key={day} className="h-4 text-xs">
              {index % 2 === 0 && day.substring(0, 3)}
            </h6>
          ))}
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between" style={{ width: `${width}px` }}>
            {recentMonths.map((month) => (
              <h6 key={month.getMonth()} className="w-full text-xs">
                {MONTHS[month.getMonth()].substring(0, 3)}
              </h6>
            ))}
          </div>
          <div className="mt-1.5 space-y-2" ref={ref}>
            {DAYS.map((day, index) => (
              <div key={day} className="flex items-start gap-2">
                {getDatesOnDay(recentDates, index).map((date) => {
                  const isActive = userActivity?.find((a) => a.created_date === date);

                  return (
                    <Tooltip
                      key={date}
                      tooltipContent={`${
                        isActive ? isActive.activity_count : 0
                      } activities on ${renderShortNumericDateFormat(date)}`}
                      theme="dark"
                    >
                      <div
                        className={`h-4 w-4 rounded ${
                          isActive
                            ? `bg-green-500 ${activitiesIntensity(isActive.activity_count)}`
                            : "bg-gray-100"
                        }`}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          {/* <div className="mt-4 grid w-full grid-flow-row grid-rows-6 gap-2">
            {recentDates.map((date) => (
              <div className="h-4 w-4 rounded bg-gray-100" />
            ))}
          </div> */}
          <div className="mt-8 flex items-center gap-2 text-xs">
            <span>Less</span>
            <span className="h-4 w-4 rounded bg-gray-100" />
            <span className="h-4 w-4 rounded bg-green-500 opacity-50" />
            <span className="h-4 w-4 rounded bg-green-500 opacity-70" />
            <span className="h-4 w-4 rounded bg-green-500 opacity-90" />
            <span className="h-4 w-4 rounded bg-green-500" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
