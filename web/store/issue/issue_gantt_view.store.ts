import { action, makeObservable, observable, runInAction } from "mobx";
// helpers
import { currentViewDataWithView } from "components/gantt-chart/data";
// types
import { ChartDataType, IGanttBlock, TGanttViews } from "components/gantt-chart";

export interface IGanttStore {
  // observables
  currentView: TGanttViews;
  currentViewData: ChartDataType | undefined;
  activeBlock: IGanttBlock | null;
  renderView: any;
  // actions
  updateCurrentView: (view: TGanttViews) => void;
  updateCurrentViewData: (data: ChartDataType | undefined) => void;
  updateActiveBlock: (block: IGanttBlock | null) => void;
  updateRenderView: (data: any[]) => void;
}

export class GanttStore implements IGanttStore {
  // observables
  currentView: TGanttViews = "month";
  currentViewData: ChartDataType | undefined = undefined;
  scrollLeft = 0;
  activeBlock: IGanttBlock | null = null;
  renderView: any[] = [];

  constructor() {
    makeObservable(this, {
      // observables
      currentView: observable.ref,
      currentViewData: observable,
      activeBlock: observable,
      renderView: observable,
      // actions
      updateCurrentView: action,
      updateCurrentViewData: action,
      updateActiveBlock: action,
      updateRenderView: action,
    });

    this.initGantt();
  }

  /**
   * @description update current view
   * @param view
   */
  updateCurrentView = (view: TGanttViews) => {
    this.currentView = view;
  };

  /**
   * @description update current view data
   * @param data
   */
  updateCurrentViewData = (data: ChartDataType | undefined) => {
    this.currentViewData = data;
  };

  /**
   * @description update active block
   * @param block
   */
  updateActiveBlock = (block: IGanttBlock | null) => {
    this.activeBlock = block;
  };

  /**
   * @description update render view
   * @param data
   */
  updateRenderView = (data: any[]) => {
    this.renderView = data;
  };

  /**
   * @description initialize gantt chart with month view
   */
  initGantt = () => {
    const newCurrentViewData = currentViewDataWithView(this.currentView);

    runInAction(() => {
      this.currentViewData = newCurrentViewData;
    });
  };
}
