import { FC } from "react";

type TInboxSidebarRoot = {};

export const InboxSidebarRoot: FC<TInboxSidebarRoot> = (props) => {
  const {} = props;

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      <div className="flex-shrink-0 w-full h-[50px] relative flex justify-between items-center gap-2 p-2">
        <div className="relative flex items-center gap-1">
          <div className="relative w-6 h-6 flex justify-center items-center rounded bg-custom-background-80">I</div>
          <div className="font-medium">Inbox</div>
        </div>
        <div>Filters Dropdown</div>
      </div>
      <div className="w-full h-auto border-t border-b border-custom-border-100">Applied Filters</div>
      <div className="w-full h-full">List of Issues</div>
    </div>
  );
};
