import { createContext } from "react";
// mobx store
import { GanttStore } from "store/issue/issue_gantt_view.store";

let ganttViewStore = new GanttStore();

export const GanttStoreContext = createContext<GanttStore>(ganttViewStore);

const initializeStore = () => {
  const _ganttStore = ganttViewStore ?? new GanttStore();
  if (typeof window === "undefined") return _ganttStore;
  if (!ganttViewStore) ganttViewStore = _ganttStore;
  return _ganttStore;
};

export const GanttStoreProvider = ({ children }: any) => {
  const store = initializeStore();
  return <GanttStoreContext.Provider value={store}>{children}</GanttStoreContext.Provider>;
};
