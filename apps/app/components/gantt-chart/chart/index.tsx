// context
import { useChart } from "../hooks";

export const ChartViewRoot = () => {
  const { allViews, currentView, viewData, dispatch } = useChart();

  console.log("currentView", currentView);
  console.log("state", viewData);
  console.log("state", dispatch);

  const handleChartView = (key: string) => {
    dispatch({ type: "CHART_VIEW", payload: key });
  };

  const handleLeft = () => {};
  const handleToday = () => {};
  const handleRight = () => {};

  return (
    <div className="relative rounded-sm border border-gray-300">
      {/* chart header */}
      <div className="flex select-none items-center justify-end gap-6 p-2">
        <div className="flex items-center justify-end gap-2">
          {allViews &&
            allViews.length > 0 &&
            allViews.map((_chatView: any, _idx: any) => (
              <div
                key={_chatView?.key}
                className={`cursor-pointer rounded-sm border border-gray-400 p-1 px-2 text-sm font-medium ${
                  currentView === _chatView?.key ? `bg-gray-200` : `hover:bg-gray-200`
                }`}
                onClick={() => handleChartView(_chatView?.key)}
              >
                {_chatView?.title}
              </div>
            ))}
        </div>

        <div className="flex items-center gap-1">
          <div className={`cursor-pointer p-1 px-2 text-sm font-medium hover:bg-gray-200`}>
            Left
          </div>
          <div className={`cursor-pointer p-1 px-2 text-sm font-medium hover:bg-gray-200`}>
            Today
          </div>
          <div className={`cursor-pointer p-1 px-2 text-sm font-medium hover:bg-gray-200`}>
            Right
          </div>
        </div>
      </div>

      {/* content */}
      <div className="border-t border-gray-300">
        <div className="relative flex h-full w-full overflow-hidden overflow-x-auto border border-red-500">
          {/* {Array.from(Array(12).keys()).map((_itemRoot: any, _idxRoot: any) => (
            <div key={_idxRoot} className="relative flex flex-col">
              <div>Hello</div>
              <div className="flex">
                {Array.from(Array(60).keys()).map((_item: any, _idx: any) => (
                  <div key={_idx} className="relative flex !w-[30px] flex-col overflow-hidden">
                    <div className="flex-shrink-0">
                      <div>{_item + 1}</div>
                    </div>
                    <div className=" h-full w-full"> </div>
                    <div className="flex-shrink-0">d </div>
                  </div>
                ))}
              </div>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
};
