import { useEffect, useState } from "react";
// context
import { useChart } from "../hooks";
// helper views
import { setMonthChartItemPosition, generateMonthDataByYear } from "../views";
// data helpers
import { datePreview, issueData } from "../data";

export const ChartViewRoot = ({ title }: any) => {
  const { allViews, currentView, currentViewData, renderView, dispatch } = useChart();
  const [itemsContainerWidth, setItemsContainerWidth] = useState<number>(0);
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  const handleChartView = (key: string) => {
    dispatch({ type: "CURRENT_VIEW", payload: key });
    updateCurrentViewRenderPayload(null);
  };

  const updateCurrentViewRenderPayload = (side: null | "left" | "right") => {
    let currentRender: any;

    if (currentView === "hours") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "day") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "week") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "bi_week") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "month") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "quarter") currentRender = generateMonthDataByYear(currentViewData, side);
    if (currentView === "year") currentRender = generateMonthDataByYear(currentViewData, side);

    // updating the prevData, currentData and nextData
    if (currentRender.payload.length > 0) {
      if (side === "left") {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentViewData: currentRender.state,
            renderView: [...currentRender.payload, ...renderView],
          },
        });
        updatingCurrentLeftScrollPosition(currentRender.scrollWidth);
      } else if (side === "right") {
        console.log("currentRender", currentRender);
        console.log("renderView", renderView);
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentViewData: currentRender.state,
            renderView: [...renderView, ...currentRender.payload],
          },
        });
      } else {
        dispatch({
          type: "PARTIAL_UPDATE",
          payload: {
            currentViewData: currentRender.state,
            renderView: [...currentRender.payload],
          },
        });
      }
      setItemsContainerWidth(itemsContainerWidth + currentRender.scrollWidth);
    }
  };

  const handleToday = () => updateCurrentViewRenderPayload(null);

  // handling the scroll positioning from left and right
  useEffect(() => {
    handleToday();
  }, []);

  const updatingCurrentLeftScrollPosition = (width: number) => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;
    scrollContainer.scrollLeft = width + scrollContainer.scrollLeft;
    setItemsContainerWidth(width + scrollContainer.scrollLeft);
  };

  // handling scroll functionality
  const onScroll = () => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    const scrollWidth: number = scrollContainer.scrollWidth;
    const clientVisibleWidth: number = scrollContainer.clientWidth;
    const currentScrollPosition: number = scrollContainer.scrollLeft;

    const approxRangeLeft: number =
      scrollWidth >= clientVisibleWidth + 1000 ? 1000 : scrollWidth - clientVisibleWidth;
    const approxRangeRight: number = scrollWidth - (approxRangeLeft + clientVisibleWidth);

    if (currentScrollPosition >= approxRangeRight) updateCurrentViewRenderPayload("right");
    if (currentScrollPosition <= approxRangeLeft) updateCurrentViewRenderPayload("left");
  };

  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container") as HTMLElement;

    scrollContainer.addEventListener("scroll", onScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, [renderView]);

  return (
    <div className="relative flex h-full flex-col rounded-sm border border-gray-300">
      {/* chart title */}
      <div className="flex w-full flex-shrink-0 select-none flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap p-2">
        <div className="text-lg font-medium">{title}</div>
      </div>

      {/* chart header */}
      <div className="flex w-full flex-shrink-0 select-none flex-wrap items-center gap-5 gap-y-3 whitespace-nowrap border-t border-gray-300 p-2">
        <div
          className="border border-gray-300 w-[30px] h-[30px] flex justify-center items-center cursor-pointer rounded-sm hover:bg-gray-100"
          onClick={() => setSidebarToggle(!sidebarToggle)}
        >
          {!sidebarToggle ? "O" : "C"}
        </div>
        <div className="mr-auto text-sm font-medium">
          {`${datePreview(currentViewData?.data?.startDate)} - ${datePreview(
            currentViewData?.data?.endDate
          )}`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      <div className="relative flex h-full w-full flex-1 overflow-hidden border-t border-gray-300">
        <div
          className="relative flex h-full w-full flex-1 flex-col overflow-hidden overflow-x-auto"
          id="scroll-container"
        >
          <div
            className="relative z-10 mt-[58px] flex h-full w-[4000px] divide-x divide-gray-300 overflow-y-auto bg-[#999] bg-opacity-5"
            style={{ width: `${itemsContainerWidth}px` }}
          >
            {sidebarToggle && (
              <div>
                <div className="absolute left-0 z-30 w-[280px] flex-shrink-0 divide-y divide-gray-300">
                  {issueData &&
                    issueData.length > 0 &&
                    issueData.map((issue) => (
                      <div
                        className="flex h-[36.5px] items-center bg-white p-1 px-2 font-medium capitalize"
                        key={`sidebar-items-${issue.name}`}
                      >
                        {issue?.name}
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="z-20 w-full">
              {issueData &&
                issueData.length > 0 &&
                issueData.map((issue) => (
                  <div
                    className="relative flex h-[36.5px] items-center"
                    key={`items-${issue.name}`}
                  >
                    <div
                      className="relative group inline-flex cursor-pointer items-center font-medium transition-all"
                      style={{
                        marginLeft: `${setMonthChartItemPosition(currentViewData, issue)}px`,
                      }}
                    >
                      <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                        <div className="absolute right-0 mr-[5px] rounded-sm bg-[#111] bg-opacity-10 px-2 py-0.5 text-xs font-medium">
                          {datePreview(issue?.start_date)}
                        </div>
                      </div>
                      <div className="rounded-sm bg-white px-4 py-1 text-sm capitalize shadow-sm">
                        {issue?.name}
                      </div>
                      <div className="flex-shrink-0 relative w-0 h-0 flex items-center invisible group-hover:visible whitespace-nowrap">
                        <div className="absolute left-0 ml-[5px] rounded-sm bg-[#111] bg-opacity-10 px-2 py-0.5 text-xs font-medium">
                          {datePreview(issue?.target_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="absolute flex h-full flex-grow">
            {renderView &&
              renderView.length > 0 &&
              renderView.map((_itemRoot: any, _idxRoot: any) => (
                <div key={`title-${_idxRoot}`} className="relative flex flex-col">
                  <div className="relative border-b border-gray-300">
                    <div className="sticky left-0 inline-flex whitespace-nowrap px-2 py-1 text-sm font-medium capitalize">
                      {_itemRoot?.title}
                    </div>
                  </div>

                  <div className="flex h-full w-full divide-x divide-gray-300">
                    {_itemRoot.children &&
                      _itemRoot.children.length > 0 &&
                      _itemRoot.children.map((_item: any, _idx: any) => (
                        <div
                          key={`sub-title-${_idxRoot}-${_idx}`}
                          className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                          style={{ width: `${currentViewData.data.width}px` }}
                        >
                          <div className="flex-shrink-0 border-b border-gray-300 py-1 text-center text-sm font-medium capitalize">
                            <div>{_item.title}</div>
                          </div>
                          <div
                            className={`h-full w-full flex-1 ${
                              ["sat", "sun"].includes(_item.dayData.shortTitle) ? `bg-gray-100` : ``
                            }`}
                          >
                            {" "}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
