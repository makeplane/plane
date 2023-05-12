// nivo
import { BarDatum } from "@nivo/bar";
// icons
import { getPriorityIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";
// constants
import {
  ANALYTICS_X_AXIS_VALUES,
  ANALYTICS_Y_AXIS_VALUES,
  generateBarColor,
} from "constants/analytics";

type Props = {
  analytics: IAnalyticsResponse;
  barGraphData: {
    data: BarDatum[];
    xAxisKeys: string[];
  };
  params: IAnalyticsParams;
  yAxisKey: "effort" | "count";
};

export const AnalyticsTable: React.FC<Props> = ({ analytics, barGraphData, params, yAxisKey }) => (
  <div className="flow-root">
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-brand-base whitespace-nowrap border-y border-brand-base">
          <thead className="bg-brand-base">
            <tr className="divide-x divide-brand-base text-sm text-brand-base">
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
                      {key}
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
          <tbody className="divide-y divide-brand-base">
            {barGraphData.data.map((item, index) => (
              <tr
                key={`table-row-${index}`}
                className="divide-x divide-brand-base text-xs text-brand-secondary"
              >
                <td
                  className={`flex items-center gap-2 whitespace-nowrap py-2 px-2.5 font-medium ${
                    params.x_axis === "priority" ? "capitalize" : ""
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
                  {addSpaceIfCamelCase(`${item.name}`)}
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
