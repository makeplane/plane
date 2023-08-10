import { FC } from "react";

// hooks
import { useChart } from "../hooks";
// types
import { IMonthBlock } from "../views";

export const MonthChartView: FC<any> = () => {
  const { currentViewData, renderView } = useChart();

  const monthBlocks: IMonthBlock[] = renderView;

  return (
    <>
      <div className="absolute flex h-full flex-grow divide-x divide-custom-border-100/50">
        {monthBlocks &&
          monthBlocks.length > 0 &&
          monthBlocks.map((block, _idxRoot) => (
            <div key={`month-${block?.month}-${block?.year}`} className="relative flex flex-col">
              <div className="relative border-b border-custom-border-200">
                <div className="sticky left-0 inline-flex whitespace-nowrap px-2 py-1 text-sm font-medium capitalize">
                  {block?.title}
                </div>
              </div>

              <div className="flex h-full w-full divide-x divide-custom-border-100/50">
                {block?.children &&
                  block?.children.length > 0 &&
                  block?.children.map((monthDay, _idx) => (
                    <div
                      key={`sub-title-${_idxRoot}-${_idx}`}
                      className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                      style={{ width: `${currentViewData?.data.width}px` }}
                    >
                      <div
                        className={`flex-shrink-0 border-b py-1 text-center text-sm capitalize font-medium ${
                          monthDay?.today
                            ? `text-red-500 border-red-500`
                            : `border-custom-border-200`
                        }`}
                      >
                        <div>{monthDay?.title}</div>
                      </div>
                      <div
                        className={`relative h-full w-full flex-1 flex justify-center ${
                          ["sat", "sun"].includes(monthDay?.dayData?.shortTitle || "")
                            ? `bg-custom-background-90`
                            : ``
                        }`}
                      >
                        {monthDay?.today && (
                          <div className="absolute top-0 bottom-0 w-[1px] bg-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
};
