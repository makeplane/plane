import dynamic from "next/dynamic";

// Dynamically import heavy chart components (Nivo charts)
export const BarGraph = dynamic(
  () => import("./bar-graph").then(module => ({ default: module.BarGraph })),
  {
    ssr: false, // Charts are client-side only
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
      </div>
    ),
  }
);

export const PieGraph = dynamic(
  () => import("./pie-graph").then(module => ({ default: module.PieGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
      </div>
    ),
  }
);

export const LineGraph = dynamic(
  () => import("./line-graph").then(module => ({ default: module.LineGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
      </div>
    ),
  }
);

export const CalendarGraph = dynamic(
  () => import("./calendar-graph").then(module => ({ default: module.CalendarGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
      </div>
    ),
  }
);

export const ScatterPlotGraph = dynamic(
  () => import("./scatter-plot-graph").then(module => ({ default: module.ScatterPlotGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-custom-primary border-t-transparent" />
      </div>
    ),
  }
);

// Re-export types (no runtime impact)
export type * from "./types.d";
