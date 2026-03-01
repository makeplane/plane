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

import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

type TProps = {
  data: { index: number; amplitude: number }[];
  barCount?: number; // number of bars to display (default: 100)
};
const MIN_HEIGHT = 2; // px minimum height for a bar

export function Waveform({ data, barCount = 100 }: TProps) {
  if (!data || data.length === 0) return null;

  // --- Resample data so we always render `barCount` bars ---
  const resampleData = (arr: typeof data, targetLength: number) => {
    const step = arr.length / targetLength;
    const result: { index: number; amplitude: number }[] = [];
    for (let i = 0; i < targetLength; i++) {
      const idx = Math.floor(i * step);
      let amp = arr[idx]?.amplitude ?? 0;

      // enforce minimum height
      if (amp === 0) {
        // choose direction: keep them centered
        amp = amp >= 0 ? MIN_HEIGHT : -MIN_HEIGHT;
      } else if (Math.abs(amp) < MIN_HEIGHT) {
        amp = amp > 0 ? MIN_HEIGHT : -MIN_HEIGHT;
      }

      result.push({ index: i, amplitude: amp });
    }
    return result;
  };

  const sampled = resampleData(data, barCount);

  return (
    <div className="w-full h-full bg-transparent text-tertiary" style={{ width: "100%", height: 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sampled} barCategoryGap={0}>
          <ReferenceLine y={0} stroke="text-placeholder" strokeDasharray="3 3" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[-128, 128]} hide />
          <Bar dataKey="amplitude" fill="currentColor" radius={[12, 12, 12, 12]} barSize={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
