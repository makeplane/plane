import React, { FC, createContext } from "react";
import { GanttStore } from "@/plane-web/store/issue_gantt_view.store";

let ganttViewStore = new GanttStore();

export const GanttStoreContext = createContext<GanttStore>(ganttViewStore);

const initializeStore = () => {
  const newGanttViewStore = ganttViewStore ?? new GanttStore();
  if (typeof window === "undefined") return newGanttViewStore;
  if (!ganttViewStore) ganttViewStore = newGanttViewStore;
  return newGanttViewStore;
};

type GanttStoreProviderProps = {
  children: React.ReactNode;
};

export const GanttStoreProvider: FC<GanttStoreProviderProps> = ({ children }) => {
  const store = initializeStore();
  return <GanttStoreContext.Provider value={store}>{children}</GanttStoreContext.Provider>;
};
