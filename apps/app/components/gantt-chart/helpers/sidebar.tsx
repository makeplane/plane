import React from "react";

export const ChartSidebar = ({
  blocks,
  loaderTitle,
  sidebarBlockRender,
  currentHoverElement,
  setCurrentHoverElement,
  currentSelectedElement,
  setCurrentSelectedElement,
}: any) => (
  <div className="w-[300px] h-full flex flex-col flex-shrink-0 divide-y divide-brand-base border-r overflow-hidden">
    <div className="h-[57px] flex items-center flex-shrink-0 px-2">
      <h3 className="text-sm font-medium text-brand-base">
        All {loaderTitle} ({blocks && blocks.length})
      </h3>
    </div>

    <div
      id="block-sidebar-container"
      className={`w-full h-full overflow-hidden overflow-y-auto`}
      onScroll={(e) => {
        const blockScroll = document.getElementById("block-items-container");
        if (!blockScroll) return;
        blockScroll.scrollTop = e.currentTarget.scrollTop;
      }}
    >
      {blocks.map((block: any, _idx: number) => (
        <div
          key={`sidebar-block-${_idx}`}
          className={`relative h-[40px] overflow-hidden cursor-pointer hover:bg-gray-100 ${
            currentSelectedElement == block?.data?.id
              ? `bg-gray-100`
              : currentHoverElement == block?.data?.id
              ? `bg-gray-100`
              : ``
          }`}
          onMouseEnter={() => setCurrentHoverElement(() => block?.data?.id)}
          onMouseLeave={() => setCurrentHoverElement(() => null)}
          onClick={() => {
            setCurrentSelectedElement(() => block?.data?.id);

            const blockCard = document.getElementById(`block-${block?.data?.id}`);
            if (!blockCard) return;

            blockCard.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });

            blockCard.classList.remove("bg-brand-base");
            blockCard.classList.add("bg-brand-surface-1");
            blockCard.classList.add("animate-pulse");
            const interval = setInterval(() => {
              blockCard.classList.remove("bg-brand-surface-1");
              blockCard.classList.add("bg-brand-base");
              blockCard.classList.remove("animate-pulse");
              clearInterval(interval);
            }, 1000);
          }}
        >
          {sidebarBlockRender(block?.data)}
        </div>
      ))}
    </div>
  </div>
);
