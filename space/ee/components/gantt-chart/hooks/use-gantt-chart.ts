import { useContext } from "react";
// mobx store
import { IGanttStore } from "@/plane-web/store/issue_gantt_view.store";
import { GanttStoreContext } from "../contexts";
// types

export const useGanttChart = (): IGanttStore => {
  const context = useContext(GanttStoreContext);
  if (context === undefined) throw new Error("useGanttChart must be used within GanttStoreProvider");
  return context;
};
