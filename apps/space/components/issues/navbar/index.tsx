"use client";

// constants
import { issueViews } from "constants/data";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";

const IssueNavbar = observer(() => {
  const store: any = useMobxStore();

  return (
    <div className="container mx-auto px-5 relative flex items-center gap-4">
      {/* project detail */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="w-[30px] h-[30px] rounded-sm flex justify-center items-center bg-gray-100"> </div>
        <div className="font-medium text-lg max-w-[300px] line-clamp-1 overflow-hidden">Project Name</div>
      </div>

      {/* issue search bar */}
      <div className="w-full"> </div>

      {/* issue views */}
      <div className="relative flex items-center gap-1 transition-all ease-in-out delay-150">
        {issueViews &&
          issueViews.length > 0 &&
          issueViews.map((_view) => (
            <div
              key={_view?.key}
              className={`w-[28px] h-[28px] flex justify-center items-center rounded-sm cursor-pointer text-gray-500 ${
                _view?.key === store?.issues?.currentIssueView
                  ? `bg-gray-200/60 text-gray-800`
                  : `hover:bg-gray-200/60 text-gray-600`
              }`}
              onClick={() => store?.issues?.setCurrentIssueView(_view?.key)}
              title={_view?.title}
            >
              <span className={`material-symbols-rounded text-[18px] ${_view?.className ? _view?.className : ``}`}>
                {_view?.icon}
              </span>
            </div>
          ))}
      </div>

      {/* issue filters */}
      <div className="relative flex items-center gap-2">
        <div>Filter</div>
        <div>View</div>
      </div>
    </div>
  );
});

export default IssueNavbar;
