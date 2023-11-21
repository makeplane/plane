import { useState } from "react";
import { usePopper } from "react-popper";
import { Calendar, Info, RotateCcw } from "lucide-react";
// types
import { DocumentDetails } from "../types/editor-types";

type Props = {
  documentDetails: DocumentDetails;
};

export const InfoPopover: React.FC<Props> = (props) => {
  const { documentDetails } = props;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );

  const { styles: infoPopoverStyles, attributes: infoPopoverAttributes } =
    usePopper(referenceElement, popperElement, {
      placement: "bottom-start",
    });

  return (
    <div
      onMouseEnter={() => setIsPopoverOpen(true)}
      onMouseLeave={() => setIsPopoverOpen(false)}
    >
      <button type="button" ref={setReferenceElement} className="mt-1.5">
        <Info className="h-3.5 w-3.5" />
      </button>
      {isPopoverOpen && (
        <div
          className="z-10 w-64 shadow-custom-shadow-rg rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 p-3 space-y-2.5"
          ref={setPopperElement}
          style={infoPopoverStyles.popper}
          {...infoPopoverAttributes.popper}
        >
          <div className="space-y-1.5">
            <h6 className="text-custom-text-400 text-xs">Last updated on</h6>
            <h5 className="text-sm flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {new Date(documentDetails.last_updated_at).toLocaleString()}
            </h5>
          </div>
          <div className="space-y-1.5">
            <h6 className="text-custom-text-400 text-xs">Created on</h6>
            <h5 className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(documentDetails.created_on).toLocaleString()}
            </h5>
          </div>
        </div>
      )}
    </div>
  );
};
