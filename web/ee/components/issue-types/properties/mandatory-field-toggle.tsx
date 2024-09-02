import { useState } from "react";
// ui
import { AlertModalCore, Checkbox, Tooltip } from "@plane/ui";

type TPropertyMandatoryFieldToggleProps = {
  value: boolean;
  defaultValue: string[];
  isDisabled?: boolean;
  onMandatoryFieldChange: (value: boolean) => void;
};

export const PropertyMandatoryFieldToggle = (props: TPropertyMandatoryFieldToggleProps) => {
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
          <span>
            <Checkbox
              checked={value}
              onChange={() => handleMandatoryFieldChange(!value)}
              disabled={isDisabled}
              className={!value ? "bg-custom-background-100" : ""}
            />
          </span>
        </Tooltip>
      </div>
    </>
  );
};
