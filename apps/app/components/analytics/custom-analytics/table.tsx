// nivo
import { BarDatum } from "@nivo/bar";
// icons
import { getPriorityIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// helpers
import { generateBarColor, renderMonthAndYear } from "helpers/analytics.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES, DATE_KEYS } from "constants/analytics";

type Props = {
  analytics: IAnalyticsResponse;
  barGraphData: {
    data: BarDatum[];
    xAxisKeys: string[];
  };
  params: IAnalyticsParams;
  yAxisKey: "count" | "estimate";
};

export const AnalyticsTable: React.FC<Props> = ({ analytics, barGraphData, params, yAxisKey }) => {
  const renderAssigneeName = (email: string): string => {
    const assignee = analytics.extras.assignee_details.find((a) => a.assignees__email === email);

    if (!assignee) return "No assignee";

    if (assignee.assignees__first_name !== "")
      return assignee.assignees__first_name + " " + assignee.assignees__last_name;

    return email;
  };

  return (
    <div className="flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-custom-border-200 whitespace-nowrap border-y border-custom-border-200">
            <thead className="bg-custom-background-80">
              <tr className="divide-x divide-custom-border-200 text-sm text-custom-text-100">
                <th scope="col" className="py-3 px-2.5 text-left font-medium">
                  {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === params.x_axis)?.label}
                </th>
                {params.segment ? (
                  barGraphData.xAxisKeys.map((key) => (
                    <th
                      key={`segment-${key}`}
                      scope="col"
                      className={`px-2.5 py-3 text-left font-medium ${
                        params.segment === "priority" || params.segment === "state__group"
                          ? "capitalize"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {params.segment === "priority" ? (
                          getPriorityIcon(key)
                        ) : (
                          <span
                            className="h-3 w-3 flex-shrink-0 rounded"
                            style={{
                              backgroundColor: generateBarColor(key, analytics, params, "segment"),
                            }}
                          />
                        )}
                        {DATE_KEYS.includes(params.segment ?? "")
                          ? renderMonthAndYear(key)
                          : params.segment === "assignees__email"
                          ? renderAssigneeName(key)
                          : key}
                      </div>
                    </th>
                  ))
                ) : (
                  <th scope="col" className="py-3 px-2.5 text-left font-medium sm:pr-0">
                    {ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === params.y_axis)?.label}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-custom-border-200">
              {barGraphData.data.map((item, index) => (
                <tr
                  key={`table-row-${index}`}
                  className="divide-x divide-custom-border-200 text-xs text-custom-text-200"
                >
                  <td
                    className={`flex items-center gap-2 whitespace-nowrap py-2 px-2.5 font-medium ${
                      params.x_axis === "priority" || params.x_axis === "state__group"
                        ? "capitalize"
                        : ""
                    }`}
                  >
                    {params.x_axis === "priority" ? (
                      getPriorityIcon(`${item.name}`)
                    ) : (
                      <span
                        className="h-3 w-3 rounded"
                        style={{
                          backgroundColor: generateBarColor(
                            `${item.name}`,
                            analytics,
                            params,
                            "x_axis"
                          ),
                        }}
                      />
                    )}
                    {params.x_axis === "assignees__email"
                      ? renderAssigneeName(`${item.name}`)
                      : addSpaceIfCamelCase(`${item.name}`)}
                  </td>
                  {params.segment ? (
                    barGraphData.xAxisKeys.map((key, index) => (
                      <td
                        key={`segment-value-${index}`}
                        className="whitespace-nowrap py-2 px-2.5 sm:pr-0"
                      >
                        {item[key] ?? 0}
                      </td>
                    ))
                  ) : (
                    <td className="whitespace-nowrap py-2 px-2.5 sm:pr-0">{item[yAxisKey]}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
