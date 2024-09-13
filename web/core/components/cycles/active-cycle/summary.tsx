import { Info, TrendingDown } from "lucide-react";

const Summary = (props) => {
  const { setAreaToHighlight } = props;
  return (
    <div className="w-[350px] border-r border-custom-border-200 py-4 pr-6">
      <div className="text-xs text-custom-text-400 font-medium">Summary of cycle issues</div>
      <div className="border-b border-custom-border-200 w-full flex text-red-500 pb-2">
        <TrendingDown className="my-auto mr-2" />
        <div className="text-md font-medium my-auto flex-1">Trailing by 36 issues</div>
        <div className="text-[20px] self-end">🏃</div>
      </div>
      <div className="space-y-4 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6">Issue states on chart</span>
          <span className="w-1/6 text-end">Issues</span>
        </div>
        <div
          className="flex text-sm"
          onMouseEnter={() => setAreaToHighlight("ideal")}
          onMouseDown={() => setAreaToHighlight("")}
        >
          <hr className="my-auto border-[1px] border-dashed w-[12px] border-indigo-400 mr-2"></hr>
          <span className="w-5/6">Today’s ideal pending</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">10</span>
        </div>
        <div
          className="flex text-sm w-full justify-between"
          onMouseEnter={() => setAreaToHighlight("pending")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <div className="flex">
            <hr className="my-auto h-[2px] border-0 w-[12px] bg-green-400 mr-2"></hr>
            <span className="w-5/6 my-auto">Pending</span>
          </div>
          <span className="text-end font-bold text-custom-text-300 bg-green-400 py-0.5 px-1 rounded text-white">
            120
          </span>
        </div>
        <div
          className="flex text-sm w-full justify-between"
          onMouseEnter={() => setAreaToHighlight("started")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <div className="flex">
            <hr className="my-auto h-[2px] border-0 w-[12px] bg-orange-500 mr-2"></hr>
            <span className="w-5/6 my-auto">Started</span>
          </div>
          <span className="text-end font-bold text-custom-text-300 bg-orange-500 py-0.5 px-1 rounded text-white">
            10
          </span>{" "}
        </div>
        <div
          className="flex text-sm"
          onMouseEnter={() => setAreaToHighlight("scope")}
          onMouseLeave={() => setAreaToHighlight("")}
        >
          <hr className="my-auto h-[2px] border-0 w-[12px] bg-blue-500 mr-2"></hr>
          <span className="w-5/6">Scope</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">10</span>
        </div>
      </div>
      <div className="space-y-4 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6">Other issue states</span>
        </div>
        <div className="flex text-sm">
          <span className="w-5/6">Unstarted</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">10</span>
        </div>
        <div className="flex text-sm">
          <span className="w-5/6">Backlog</span>
          <span className="w-1/6 text-end font-bold text-custom-text-300">10</span>
        </div>
      </div>
      <div className="text-xs text-custom-text-400 font-medium flex pt-2 gap-2">
        <Info className="text-xs mt-[2px]" size={12} />
        <div className="flex flex-col space-y-2">
          <span>2 Cancelled issues (excluded)</span>
          <span>Scope has changed 5 times</span>
        </div>
      </div>
    </div>
  );
};
export default Summary;
