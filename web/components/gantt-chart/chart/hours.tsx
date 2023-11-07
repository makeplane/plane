import { FC } from "react";
// context
import { useChart } from "../hooks";

export const HourChartView: FC<any> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentView, currentViewData, renderView, dispatch, allViews } = useChart();

  return (
    <>
      <div className="absolute flex h-full flex-grow divide-x divide-custom-border-200">
        {renderView &&
          renderView.length > 0 &&
          renderView.map((_itemRoot: any, _idxRoot: any) => (
            <div key={`title-${_idxRoot}`} className="relative flex flex-col">
              <div className="relative border-b border-custom-border-200">
                <div className="sticky left-0 inline-flex whitespace-nowrap px-2 py-1 text-sm font-medium capitalize">
                  {_itemRoot?.title}
                </div>
              </div>

              <div className="flex h-full w-full divide-x divide-custom-border-200">
                {_itemRoot.children &&
                  _itemRoot.children.length > 0 &&
                  _itemRoot.children.map((_item: any, _idx: any) => (
                    <div
                      key={`sub-title-${_idxRoot}-${_idx}`}
                      className="relative flex h-full flex-col overflow-hidden whitespace-nowrap"
                      style={{ width: `${currentViewData?.data.width}px` }}
                    >
                      <div
                        className={`flex-shrink-0 border-b py-1 text-center text-sm capitalize font-medium ${
                          _item?.today ? `text-red-500 border-red-500` : `border-custom-border-200`
                        }`}
                      >
                        <div>{_item.title}</div>
                      </div>
                      <div
                        className={`relative h-full w-full flex-1 flex justify-center ${
                          ["sat", "sun"].includes(_item?.dayData?.shortTitle || "") ? `bg-gray-100` : ``
                        }`}
                      >
                        {_item?.today && <div className="absolute top-0 bottom-0 border border-red-500"> </div>}
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
