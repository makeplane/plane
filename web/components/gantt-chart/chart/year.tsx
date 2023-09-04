import { FC } from "react";
// context
import { useChart } from "../hooks";
import { IYearBlock } from "../views";

export const YearChartView: FC<any> = () => {
  const { currentViewData, renderView } = useChart();

  const yearBlocks: IYearBlock[] = renderView;

  console.log("yearBlocks", yearBlocks);

  return (
    <>
      <div className="absolute flex h-full flex-grow divide-x divide-custom-border-100/50">
        {yearBlocks &&
          yearBlocks.length > 0 &&
          yearBlocks.map((block, _idxRoot) => (
            <div key={`year-${block.year}-${block.month}`} className="relative flex flex-col">
              <div className="h-[60px] w-full">
                <div className="relative h-[30px]">
                  <div className="sticky left-0 inline-flex whitespace-nowrap px-3 py-2 text-xs font-medium capitalize">
                    {block?.title}
                  </div>
                </div>
                <div className="flex w-full h-[30px]">
                  {block?.children &&
                    block.children.length > 0 &&
                    block.children.map((monthWeek, _idx: any) => (
                      <div
                        key={`sub-title-${_idxRoot}-${_idx}`}
                        className="flex-shrink-0 border-b py-1 text-center capitalize border-custom-border-200"
                        style={{ width: `${currentViewData?.data.width}px` }}
                      >
                        <div className="text-xs">
                          <span
                            className={
                              monthWeek.today
                                ? "bg-custom-primary-100 text-white px-1 rounded-full"
                                : "text-custom-text-200"
                            }
                          >
                            {monthWeek.date.getDate()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex h-full w-full divide-x divide-custom-border-100/50">
                {block.children &&
                  block.children.length > 0 &&
                  block.children.map((monthWeek, _idx) => (
                    <div
                      key={`column-${_idxRoot}-${_idx}`}
                      className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                      style={{ width: `${currentViewData?.data.width}px` }}
                    >
                      <div
                        className={`relative h-full w-full flex-1 flex justify-center ${
                          ["sat", "sun"].includes(monthWeek?.dayData?.shortTitle || "")
                            ? `bg-custom-background-90`
                            : ``
                        }`}
                      >
                        {/* {monthDay?.today && (
                        <div className="absolute top-0 bottom-0 w-[1px] bg-red-500" />
                      )} */}
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
