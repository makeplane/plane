import { useTranslation } from "@plane/i18n";
import { Button, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";

type TProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackMessage: string) => void;
};

export const FeedbackModal = observer((props: TProps) => {
  const { isOpen, onClose, onSubmit } = props;
  // react hook form
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<{
    message: string;
  }>({
    defaultValues: { message: "" },
  });
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleFormSubmit = async (formData: { message: string }) => {
    await onSubmit(formData.message);
    handleClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.MD}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">Feedback </h3>
          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              <label htmlFor="url" className="mb-2 text-custom-text-300 text-base font-medium">
                Please provide details: (optional)
              </label>
              <Controller
                control={control}
                name="message"
                rules={{
                  required: false,
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <TextArea
                    id="message"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.message)}
                    placeholder="What was unsatisfying about this response?"
                    className="w-full resize-none min-h-24 text-base"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} className="capitalize">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
