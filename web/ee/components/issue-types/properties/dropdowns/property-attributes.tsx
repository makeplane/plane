import { useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { ChevronDown } from "lucide-react";
import { Popover } from "@headlessui/react";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { SelectedAttributeProperties } from "@/plane-web/components/issue-types/properties";
// plane web helpers
import { getIssuePropertyAttributeDisplayName } from "@/plane-web/helpers/issue-properties.helper";
// plane web types
import {
  EIssuePropertyType,
  TCreationListModes,
  TIssueProperty,
  TOperationMode,
  TIssuePropertyOptionCreateList,
} from "@/plane-web/types";

type TPropertyAttributesDropdownProps = {
  issueTypeId: string;
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode | null;
  issuePropertyOptionCreateList: TIssuePropertyOptionCreateList[];
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  handleIssuePropertyOptionCreateList: (mode: TCreationListModes, value: TIssuePropertyOptionCreateList) => void;
  disabled?: boolean;
};

export const PropertyAttributesDropdown = observer((props: TPropertyAttributesDropdownProps) => {
  const {
    issueTypeId,
    propertyDetail,
    currentOperationMode,
    issuePropertyOptionCreateList,
    handleIssuePropertyOptionCreateList,
    onPropertyDetailChange,
    disabled,
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // derived values
  const attributeDisplayName = getIssuePropertyAttributeDisplayName(propertyDetail);
  // list of property types that should not be allowed to change attributes
  const DISABLE_ATTRIBUTE_CHANGE_LIST = [EIssuePropertyType.BOOLEAN, EIssuePropertyType.DATETIME];

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  if (
    !currentOperationMode ||
    (propertyDetail.property_type && DISABLE_ATTRIBUTE_CHANGE_LIST.includes(propertyDetail.property_type))
  ) {
    return (
      <span className="px-2 py-0.5 font-medium text-custom-text-300 bg-custom-background-80/40 rounded">
        {attributeDisplayName ?? ""}
      </span>
    );
  }

  return (
    <Popover>
      <Tooltip disabled={!disabled} tooltipContent="Please select a property type">
        <Popover.Button as="div">
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between gap-1 px-2 py-1 text-sm bg-custom-background-100 hover:bg-custom-background-80 border-[0.5px] border-custom-border-300 rounded cursor-pointer outline-none",
              {
                "bg-custom-background-90 cursor-not-allowed": disabled,
                "py-2": !attributeDisplayName,
              }
            )}
            disabled={disabled}
            ref={setReferenceElement}
          >
            <span className="text-custom-text-200">{attributeDisplayName ?? ""}</span>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        </Popover.Button>
      </Tooltip>
      {createPortal(
        <Popover.Panel data-prevent-outside-click className="fixed z-10">
          <div
            className="w-60 bg-custom-background-100 border-[0.5px] border-custom-border-300 rounded my-1 py-4 px-2 shadow-custom-shadow-rg"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <SelectedAttributeProperties
              issueTypeId={issueTypeId}
              propertyDetail={propertyDetail}
              currentOperationMode={currentOperationMode}
              issuePropertyOptionCreateList={issuePropertyOptionCreateList}
              onPropertyDetailChange={onPropertyDetailChange}
              handleIssuePropertyOptionCreateList={handleIssuePropertyOptionCreateList}
            />
          </div>
        </Popover.Panel>,
        document.body
      )}
    </Popover>
  );
});
