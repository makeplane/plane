import { useMemo } from "react";
import { Button } from "@plane/propel/button";
import { EModalWidth, Input, ModalCore } from "@plane/ui";

type TApplicationFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  applicationName: string;
  onApplicationNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const ApplicationFormModal = ({
  isOpen,
  isSubmitting,
  applicationName,
  onApplicationNameChange,
  onClose,
  onSubmit,
}: TApplicationFormModalProps) => {
  const canSubmit = useMemo(() => applicationName.trim().length > 0, [applicationName]);

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.MD}>
      <div className="space-y-4 p-5">
        <h3 className="text-xl font-medium text-custom-text-100">Create application</h3>

        <div className="space-y-1">
          <label className="text-sm font-medium text-custom-text-200" htmlFor="application-name">
            Application name
          </label>
          <Input
            id="application-name"
            value={applicationName}
            onChange={(event) => onApplicationNameChange(event.target.value)}
            placeholder="Application name"
            className="w-full"
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) {
                event.preventDefault();
                onSubmit();
              }
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 px-5 py-4">
        <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onSubmit} loading={isSubmitting} disabled={!canSubmit}>
          Save
        </Button>
      </div>
    </ModalCore>
  );
};
