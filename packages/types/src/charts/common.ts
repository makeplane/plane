/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TChartColorScheme = "modern" | "horizon" | "earthen";

export type TChartDatum = {
  key: string;
  name: string;
  count: number;
} & Record<string, number>;

export type TChart = {
  data: TChartDatum[];
  schema: Record<string, string>;
};
