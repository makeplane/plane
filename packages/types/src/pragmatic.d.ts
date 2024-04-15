export type TDropTarget = {
  element: Element;
  data: Record<string | symbol, unknown>;
};

export type TDropTargetMiscellaneousData = {
  dropEffect: string;
  isActiveDueToStickiness: boolean;
};

export interface IPragmaticDropPayload {
  location: {
    initial: {
      dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
    };
    current: {
      dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
    };
    previous: {
      dropTargets: (TDropTarget & TDropTargetMiscellaneousData)[];
    };
  };
  source: TDropTarget;
  self: TDropTarget & TDropTargetMiscellaneousData;
}
