import { BarDatum } from "@nivo/bar";

// icons
import { PriorityIcon } from "@plane/ui";
// helpers
import { generateBarColor, generateDisplayName } from "helpers/analytics.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse, TIssuePriorities } from "@plane/types";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "constants/analytics";

type Props = {
  analytics: IAnalyticsResponse;
  barGraphData: {
    data: BarDatum[];
    xAxisKeys: string[];
  };
  params: IAnalyticsParams;
  yAxisKey: "count" | "estimate";
};

export const AnalyticsTable: React.FC<Props> = ({ analytics, barGraphData, params, yAxisKey }) => (
  <div className="flow-root">
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-custom-border-200 whitespace-nowrap border-y border-custom-border-200">
          <thead className="bg-custom-background-80">
            <tr className="divide-x divide-custom-border-200 text-sm text-custom-text-100">
              <th scope="col" className="px-2.5 py-3 text-left font-medium">
                {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === params.x_axis)?.label}
              </th>
              {params.segment ? (
                barGraphData.xAxisKeys.map((key) => (
                  <th
                    key={`segment-${key}`}
                    scope="col"
                    className={`px-2.5 py-3 text-left font-medium ${
                      params.segment === "priority" || params.segment === "state__group" ? "capitalize" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {params.segment === "priority" ? (
                        <PriorityIcon priority={key as TIssuePriorities} />
                      ) : (
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded"
                          style={{
                            backgroundColor: generateBarColor(key, analytics, params, "segment"),
                          }}
                        />
                      )}
                      {generateDisplayName(key, analytics, params, "segment")}
                    </div>
                  </th>
                ))
              ) : (
                <th scope="col" className="px-2.5 py-3 text-left font-medium sm:pr-0">
                  {ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === params.y_axis)?.label}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-custom-border-200">
            {barGraphData.data.map((item, index) => (
              <tr key={`table-row-${index}`} className="divide-x divide-custom-border-200 text-xs text-custom-text-200">
                <td
                  className={`flex items-center gap-2 whitespace-nowrap px-2.5 py-2 font-medium ${
                    params.x_axis === "priority" || params.x_axis === "state__group" ? "capitalize" : ""
                  }`}
                >
                  {params.x_axis === "priority" ? (
                    <PriorityIcon priority={item.name as TIssuePriorities} />
                  ) : (
                    <span
                      className="h-3 w-3 rounded"
                      style={{
                        backgroundColor: generateBarColor(`${item.name}`, analytics, params, "x_axis"),
                      }}
                    />
                  )}
                  {generateDisplayName(`${item.name}`, analytics, params, "x_axis")}
                </td>
                {params.segment ? (
                  barGraphData.xAxisKeys.map((key, index) => (
                    <td key={`segment-value-${index}`} className="whitespace-nowrap px-2.5 py-2 sm:pr-0">
                      {item[key] ?? 0}
                    </td>
                  ))
                ) : (
                  <td className="whitespace-nowrap px-2.5 py-2 sm:pr-0">{item[yAxisKey]}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
