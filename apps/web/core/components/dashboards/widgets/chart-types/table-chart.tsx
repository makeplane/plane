/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { WIDGET_X_AXIS_PROPERTIES_LIST, WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// local imports
import type { TWidgetComponentProps } from ".";

export const DashboardTableChartWidget = observer(function DashboardTableChartWidget(props: TWidgetComponentProps) {
  const { isEditModeEnabled, parsedData, widget, onClick } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const { group_by, x_axis_property } = widget ?? {};
  // columns = x-axis items (each datum)
  const columns = parsedData.data;
  // rows = schema keys (group values)
  const groupKeys = Object.keys(parsedData.schema);
  const hasGroupKeys = groupKeys.length > 0;
  // first column header label — the group_by property name
  const groupByLabel = group_by ? t(WIDGET_X_AXIS_PROPERTIES_LIST[group_by].i18n_label) : "";

  // If there are no columns at all, there is nothing to render.
  if (!columns.length) return null;

  return (
    <div className="flex size-full flex-col overflow-hidden px-4 pb-2 mt-2">
      {hasGroupKeys ? (
        <>
          <table className="w-full shrink-0 border-collapse text-xs" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-subtle-1">
                <th
                  className="min-w-0 pr-3 pb-2 text-left text-tertiary text-caption-sm-regular truncate"
                  title={groupByLabel}
                >
                  {groupByLabel}
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn("min-w-0 pr-3 pb-2 text-left text-tertiary text-caption-sm-regular truncate", {
                      "cursor-pointer": !isEditModeEnabled,
                    })}
                    title={col.name}
                    onClick={() => {
                      if (!x_axis_property) return;
                      onClick?.({
                        [`${WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY[x_axis_property]}__in`]: col.key,
                      });
                    }}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="min-h-0 flex-1 overflow-auto vertical-scrollbar scrollbar-xs">
            <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
              <tbody>
                {groupKeys.map((groupKey) => {
                  const groupLabel = parsedData.schema[groupKey];
                  return (
                    <tr key={groupKey} className="transition-colors">
                      <td
                        className={cn(
                          "sticky left-0 z-10 min-w-0 bg-surface-1 pr-3 py-3 text-secondary text-body-xs-regular truncate",
                          {
                            "cursor-pointer": !isEditModeEnabled,
                          }
                        )}
                        title={groupLabel}
                        onClick={() => {
                          if (!group_by) return;
                          onClick?.({
                            [`${WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY[group_by]}__in`]: groupKey,
                          });
                        }}
                      >
                        {groupLabel}
                      </td>
                      {columns.map((col) => {
                        const cellValue = col[groupKey] ?? 0;
                        return (
                          <td
                            key={col.key}
                            className={cn("min-w-0 pr-3 py-3 text-primary tabular-nums text-body-xs-regular truncate", {
                              "cursor-pointer": !isEditModeEnabled,
                            })}
                            title={String(cellValue)}
                            onClick={() => {
                              if (!x_axis_property || !group_by) return;
                              onClick?.({
                                and: [
                                  { [`${WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY[x_axis_property]}__in`]: col.key },
                                  { [`${WIDGET_X_AXIS_PROPERTY_TO_FILTER_KEY[group_by]}__in`]: groupKey },
                                ],
                              });
                            }}
                          >
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-tertiary">
          <span>{t("dashboards.widget.chart_types.table_chart.configure_rows_hint")}</span>
        </div>
      )}
    </div>
  );
});
