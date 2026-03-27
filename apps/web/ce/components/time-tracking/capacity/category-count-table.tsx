/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Donut pie chart showing issue count per category.
 * Used in the Capacity tab for Main Task Category and Sub Task Category.
 */

import type { FC } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "@plane/i18n";
import type { ICategoryCount } from "@plane/types";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#ef4444", "#14b8a6"];

interface CategoryPieChartProps {
  title: string;
  categories: ICategoryCount[];
  isLoading?: boolean;
}

export const CategoryCountTable: FC<CategoryPieChartProps> = ({ title, categories, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-1 p-4">
      <span className="text-12 font-medium tracking-wide uppercase text-tertiary">{title}</span>
      {isLoading ? (
        <div className="py-4 text-center text-12 text-tertiary animate-pulse">{t("common.loading")}</div>
      ) : categories.length === 0 ? (
        <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
      ) : (
        <div className="w-full" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                paddingAngle={2}
              >
                {categories.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ pointerEvents: "none" }}
                contentStyle={{
                  backgroundColor: "var(--color-surface-1)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
