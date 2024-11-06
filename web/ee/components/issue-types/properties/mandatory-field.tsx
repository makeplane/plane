import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore, Checkbox, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TPropertyMandatoryFieldCheckboxProps = {
  value: boolean;
  defaultValue: string[];
  isDisabled?: boolean;
  onMandatoryFieldChange: (value: boolean) => void;
};

export const PropertyMandatoryFieldCheckbox = observer((props: TPropertyMandatoryFieldCheckboxProps) => {
  const { value, defaultValue, isDisabled = false, onMandatoryFieldChange } = props;
  // states
  const [isDefaultResetConfirmationOpen, setIsDefaultResetConfirmationOpen] = useState<boolean>(false);

  const handleMandatoryFieldChange = (value: boolean) => {
    if (!!defaultValue.length && value) {
      setIsDefaultResetConfirmationOpen(true);
    } else {
      onMandatoryFieldChange(value);
    }
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isDefaultResetConfirmationOpen}
        handleClose={() => setIsDefaultResetConfirmationOpen(false)}
        handleSubmit={() => {
          onMandatoryFieldChange(true);
          setIsDefaultResetConfirmationOpen(false);
        }}
        isSubmitting={false}
        title="Mandatory property"
        content={
          <p>
            There seems to be a default option for this property. Making the property mandatory will remove the default
            value and the users will have to add a value of their choice.
          </p>
        }
        primaryButtonText={{
          loading: "Please wait...",
          default: "Mandate",
        }}
      />
      <div className="flex flex-shrink-0 items-center justify-center">
        <Tooltip
          className="w-52 shadow"
          tooltipContent={
            isDisabled
              ? "This property type cannot be made mandatory"
              : value
                ? "Uncheck to mark the field as optional"
                : "Check to mark the field as mandatory"
          }
          position="bottom"
        >
          <span
            className={cn(
              "flex items-center gap-1.5 text-custom-text-300 text-xs font-medium select-none",
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={() => {
              if (isDisabled) return;
              handleMandatoryFieldChange(!value);
            }}
          >
            <Checkbox
              checked={value}
              disabled={isDisabled}
              className={cn("size-3.5", {
                "bg-custom-background-100": !value,
              })}
              iconClassName="size-3.5"
            />
            Mandatory property
          </span>
        </Tooltip>
      </div>
    </>
  );
});
