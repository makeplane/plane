import { useState } from "react";
import { usePopper } from "react-popper";
import { Calendar, History, Info } from "lucide-react";
// types
import { DocumentDetails } from "src/types/editor-types";

type Props = {
  documentDetails: DocumentDetails;
};

// function to render a Date in the format- 25 May 2023 at 2:53PM
const renderDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedDate: string = new Intl.DateTimeFormat("en-US", options).format(date);

  return formattedDate;
};

export const InfoPopover: React.FC<Props> = (props) => {
  const { documentDetails } = props;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles: infoPopoverStyles, attributes: infoPopoverAttributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

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
              {renderDate(new Date(documentDetails.last_updated_at))}
            </h5>
          </div>
          <div className="space-y-1.5">
            <h6 className="text-xs text-custom-text-400">Created on</h6>
            <h5 className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {renderDate(new Date(documentDetails.created_on))}
            </h5>
          </div>
        </div>
      )}
    </div>
  );
};
