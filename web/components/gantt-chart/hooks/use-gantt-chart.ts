import { useContext } from "react";
// mobx store
import { GanttStoreContext } from "@/components/gantt-chart/contexts";
// types
import { IGanttStore } from "@/store/issue/issue_gantt_view.store";

export const useGanttChart = (): IGanttStore => {
  const context = useContext(GanttStoreContext);
  if (context === undefined) throw new Error("useGanttChart must be used within GanttStoreProvider");
  return context;
};
