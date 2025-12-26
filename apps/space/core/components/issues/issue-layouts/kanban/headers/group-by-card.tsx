import { observer } from "mobx-react";
import { Circle } from "lucide-react";
// types
import type { TIssueGroupByOptions } from "@plane/types";

interface IHeaderGroupByCard {
  groupBy: TIssueGroupByOptions | undefined;
  icon?: React.ReactNode;
  title: string;
  count: number;
}

export const HeaderGroupByCard = observer(function HeaderGroupByCard(props: IHeaderGroupByCard) {
  const { icon, title, count } = props;

  return (
    <>
      <div className="relative flex shrink-0 gap-2 p-1.5 w-full flex-row items-center">
        <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-xs">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>
        <div className="relative flex items-center gap-1 w-full flex-row overflow-hidden">
          <div className="line-clamp-1 inline-block overflow-hidden truncate font-medium text-primary">{title}</div>
          <div className="shrink-0 text-13 font-medium text-tertiary pl-2">{count || 0}</div>
        </div>
      </div>
    </>
  );
});
