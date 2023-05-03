import { useEffect, useState } from "react";
// context
import { useChart } from "../hooks";
// helper views
import { generateMonthDataByYear } from "../views";

export const ChartViewRoot = () => {
  const { allViews, currentView, currentViewData, dispatch } = useChart();

  const [renderView, setRenderView] = useState<any>([]);

  const handleChartView = (key: string) => {
    dispatch({ type: "CURRENT_VIEW", payload: key });
  };

  const updateCurrentViewRenderPayload = (side: null | "left" | "right") => {
    let viewData: any;

    if (currentView === "hours") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "day") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "week") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "bi_week") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "month") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "quarter") viewData = generateMonthDataByYear(currentViewData, side);
    if (currentView === "year") viewData = generateMonthDataByYear(currentViewData, side);

    // updating the prevData, currentData and nextData

    if (side === "left") setRenderView((prevData: any) => [...viewData, ...prevData]);
    else setRenderView((prevData: any) => [...prevData, ...viewData]);
  };

  const handleToday = () => {
    updateCurrentViewRenderPayload(null);
  };

  // handling the scroll positioning from left and right
  useEffect(() => {
    // init chart
    updateCurrentViewRenderPayload(null);

    // init scroll handler
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    let currentScrollPosition: number = scrollContainer.scrollLeft;
    const approxRangeLeft: number = scrollContainer.clientWidth * 2;
    const approxRangeRight: number = scrollContainer.scrollWidth - approxRangeLeft;

    scrollContainer.addEventListener("scroll", () => {
      currentScrollPosition = scrollContainer.scrollLeft;
      if (currentScrollPosition <= approxRangeLeft) updateCurrentViewRenderPayload("left");
      if (currentScrollPosition >= approxRangeRight) updateCurrentViewRenderPayload("right");
    });
  }, []);

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
                onClick={() => handleChartView(_chatView)}
              >
                {_chatView?.title}
              </div>
            ))}
        </div>

        <div className="flex items-center gap-1">
          <div
            className={`cursor-pointer p-1 px-2 text-sm font-medium hover:bg-gray-200`}
            onClick={handleToday}
          >
            Today
          </div>
        </div>
      </div>

      {/* content */}
      <div className="border-t border-gray-300">
        <div
          className="relative flex h-full w-full divide-x divide-gray-300 overflow-hidden overflow-x-auto"
          id="scroll-container"
        >
          {renderView &&
            renderView.length > 0 &&
            renderView.map((_itemRoot: any, _idxRoot: any) => (
              <div key={`title-${_idxRoot}`} className="relative flex flex-col">
                <div className="relative border-b border-gray-300">
                  <div className="sticky left-0 inline-flex font-medium capitalize">
                    {_itemRoot?.title}
                  </div>
                </div>
                <div className="flex divide-x divide-gray-300">
                  {_itemRoot.weeks &&
                    _itemRoot.weeks.length > 0 &&
                    _itemRoot.weeks.map((_item: any, _idx: any) => (
                      <div
                        key={`sub-title-${_idxRoot}-${_idx}`}
                        className="relative flex !w-[70px] flex-col overflow-hidden"
                      >
                        <div className="flex-shrink-0">
                          <div>{_item.title}</div>
                        </div>
                        {Array.from(Array(200).keys()).map((_key: number) => (
                          <div
                            key={`items-${_idxRoot}-${_idx}-${_key}`}
                            className="h-[30px] w-full border border-red-500"
                          >
                            {" "}
                          </div>
                        ))}
                        <div className="flex-shrink-0 border border-black"> </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
