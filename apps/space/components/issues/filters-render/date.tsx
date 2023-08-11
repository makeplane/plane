"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";

const IssueDateFilter = observer(() => {
  const store = useMobxStore();

  return (
    <>
      <div className="flex items-center gap-2 border border-gray-300 px-2 py-1 pr-1 rounded">
        <div className="flex-shrink-0 font-medium">Due Date</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {/* <div className="flex items-center gap-1 border border-gray-300 px-[2px] py-0.5 rounded-full">
            <div className="w-[18px] h-[18px] cursor-pointer flex justify-center items-center overflow-hidden rounded-full border border-gray-300">
              <span className={`material-symbols-rounded text-[16px]`}>close</span>
            </div>
            <div>Backlog</div>
            <div
              className={`w-[18px] h-[18px] cursor-pointer flex justify-center items-center overflow-hidden rounded-full text-gray-500 hover:bg-gray-200/60 hover:text-gray-600`}
            >
              <span className={`material-symbols-rounded text-[16px]`}>close</span>
            </div>
          </div> */}
        </div>
        <div
          className={`w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-600`}
        >
          <span className={`material-symbols-rounded text-[16px]`}>close</span>
        </div>
      </div>
    </>
  );
});

export default IssueDateFilter;
