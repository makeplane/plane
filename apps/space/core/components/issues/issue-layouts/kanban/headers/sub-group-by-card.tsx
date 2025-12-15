import { observer } from "mobx-react";
import { Circle } from "lucide-react";
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";
// mobx

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export const HeaderSubGroupByCard = observer(function HeaderSubGroupByCard(props: IHeaderSubGroupByCard) {
  const { icon, title, count, isExpanded, toggleExpanded } = props;
  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row items-center gap-2 rounded-xs p-1.5 cursor-pointer`}
      onClick={() => toggleExpanded()}
    >
      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs transition-all hover:bg-layer-1">
        {isExpanded ? <ChevronUpIcon width={14} strokeWidth={2} /> : <ChevronDownIcon width={14} strokeWidth={2} />}
      </div>

      <div className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xs">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 text-13">
        <div className="line-clamp-1 text-primary">{title}</div>
        <div className="pl-2 text-13 font-medium text-tertiary">{count || 0}</div>
      </div>
    </div>
  );
});
