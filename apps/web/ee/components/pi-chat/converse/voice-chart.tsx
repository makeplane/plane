import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

type TProps = {
  data: { index: number; amplitude: number }[];
  barCount?: number; // number of bars to display (default: 100)
};
const MIN_HEIGHT = 2; // px minimum height for a bar

export const Waveform: React.FC<TProps> = ({ data, barCount = 100 }) => {
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
    <div className="w-full h-full bg-transparent text-custom-text-300" style={{ width: "100%", height: 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sampled} barCategoryGap={0}>
          <ReferenceLine y={0} stroke="text-custom-text-400" strokeDasharray="3 3" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[-128, 128]} hide />
          <Bar dataKey="amplitude" fill="currentColor" radius={[12, 12, 12, 12]} barSize={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
