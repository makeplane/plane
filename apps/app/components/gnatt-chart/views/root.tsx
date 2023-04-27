import React from "react";
// helpers
import { generateYearDataByYear } from "../helpers/month-view";

export const GnattChartRoot = () => {
  const [enableSidebar, setEnableSidebar] = React.useState(true);

  React.useEffect(() => {
    generateYearDataByYear(1997);
  }, []);

  return (
    <div className="relative flex min-h-[500px] border border-gray-500">
      {enableSidebar ? (
        <div className="relative flex w-[280px] flex-shrink-0 flex-col border-r border-gray-500">
          {/* sidebar header section */}
          <div className="sticky top-0 flex h-[50px] w-full flex-shrink-0 items-center px-2 py-1">
            <div>Icon</div>
            <div>Circles</div>
          </div>

          {/* sidebar content section */}
          <div className="h-full w-full divide-y border-t border-b border-gray-500">
            {Array.from(Array(200).keys()).map((_item: any, _idx: any) => (
              <div key={_idx} className="p-1 px-2 text-sm font-medium ">
                Untitled
              </div>
            ))}
          </div>

          {/* sidebar footer section */}
          <div className="flex h-[50px] w-full flex-shrink-0 items-center px-2 py-1">Footer</div>
        </div>
      ) : (
        ""
      )}

      <div className="relative flex w-full divide-x overflow-x-auto">
        {Array.from(Array(30).keys()).map((_item: any, _idx: any) => (
          <div key={_idx} className="relative flex flex-col">
            <div className="sticky top-0 flex h-[50px] w-full flex-shrink-0 items-center px-2 py-1">
              <div className="w-[200px]">{_item + 1}</div>
            </div>
            <div className="h-full w-full divide-y border-t border-b border-gray-500"> </div>
            <div className="h-[50px] w-full flex-shrink-0">d </div>
          </div>
        ))}
      </div>

      {/* <div
              className="absolute top-0 bottom-0 left-[10px] my-auto flex h-[35px] w-[35px] cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-gray-300 bg-[#ffffff]"
              onClick={() => setEnableSidebar(!enableSidebar)}
            >
              {enableSidebar ? (
                <span className="material-symbols-rounded">menu_open</span>
              ) : (
                <span className="material-symbols-rounded">menu</span>
              )}
            </div> */}
    </div>
  );
};
