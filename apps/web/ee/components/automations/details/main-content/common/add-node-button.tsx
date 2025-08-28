import { PlusCircle } from "lucide-react";
import { AutomationDetailsMainContentBlockWrapper } from "./block-wrapper";

type TProps = {
  label: string;
  isSelected?: boolean;
  onClick: () => void;
};

export const AutomationDetailsMainContentAddNodeButton: React.FC<TProps> = (props) => {
  const { label, isSelected, onClick } = props;

  return (
    <AutomationDetailsMainContentBlockWrapper isSelected={isSelected} onClick={onClick}>
      <button
        type="button"
        className="group/add-button flex-grow w-full h-14 flex items-center justify-center outline-none border-none transition-all"
        onClick={onClick}
      >
        <span className="flex items-center gap-1.5">
          <PlusCircle className="flex-shrink-0 size-5 text-custom-background-100 fill-custom-text-200 group-hover/add-button:fill-custom-text-100 transition-colors" />
          <p className="text-sm font-medium text-custom-text-200 group-hover/add-button:text-custom-text-100 transition-colors">
            {label}
          </p>
        </span>
      </button>
    </AutomationDetailsMainContentBlockWrapper>
  );
};
