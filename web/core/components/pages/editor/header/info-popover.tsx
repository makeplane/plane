import { useState } from "react";
import { usePopper } from "react-popper";
import { Calendar, History, Info } from "lucide-react";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  page: IPage;
};

export const PageInfoPopover: React.FC<Props> = (props) => {
  const { page } = props;
  // states
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  // refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js
  const { styles: infoPopoverStyles, attributes: infoPopoverAttributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });
  // derived values
  const { created_at, updated_at } = page;

  return (
    <div onMouseEnter={() => setIsPopoverOpen(true)} onMouseLeave={() => setIsPopoverOpen(false)}>
      <button type="button" ref={setReferenceElement} className="block">
        <Info className="h-3.5 w-3.5" />
      </button>
      {isPopoverOpen && (
        <div
          className="z-10 w-64 space-y-2.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 p-3 shadow-custom-shadow-rg"
          ref={setPopperElement}
          style={infoPopoverStyles.popper}
          {...infoPopoverAttributes.popper}
        >
          <div className="space-y-1.5">
            <h6 className="text-xs text-custom-text-400">Last updated on</h6>
            <h5 className="flex items-center gap-1 text-sm">
              <History className="h-3 w-3" />
              {renderFormattedDate(updated_at)}
            </h5>
          </div>
          <div className="space-y-1.5">
            <h6 className="text-xs text-custom-text-400">Created on</h6>
            <h5 className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {renderFormattedDate(created_at)}
            </h5>
          </div>
        </div>
      )}
    </div>
  );
};
