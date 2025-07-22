import { PlusIcon } from "lucide-react";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  count: number;
  label: string;
  handleAdd: () => void;
  style?: React.CSSProperties;
  onClick?: () => void;
  customClassName?: string;
};
export const ListHeader = (props: Props) => {
  const { count, label, handleAdd, style, onClick, customClassName } = props;

  return (
    <Row
      onClick={onClick}
      className={cn("w-full flex-shrink-0 border-b-[1px] border-custom-border-200 bg-custom-background-90 pr-3 py-2.5", customClassName)}
      style={style}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-custom-text-100">{label}</span>
          <span className="text-sm font-medium text-custom-text-100">{count}</span>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAdd();
          }}
          className="cursor-pointer"
        >
          <PlusIcon className="size-4" />
        </div>
      </div>
    </Row>
  );
};
