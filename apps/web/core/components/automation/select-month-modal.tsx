import { useParams } from "next/navigation";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import type { IProject } from "@plane/types";
// ui
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

// types
type Props = {
  isOpen: boolean;
  type: "auto-close" | "auto-archive";
  initialValues: Partial<IProject>;
  handleClose: () => void;
  handleChange: (formData: Partial<IProject>) => Promise<void>;
};

export function SelectMonthModal({ type, initialValues, isOpen, handleClose, handleChange }: Props) {
  const { workspaceSlug, projectId } = useParams();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<IProject>({
    defaultValues: initialValues,
  });

  const onClose = () => {
    handleClose();
    reset(initialValues);
  };

  const onSubmit = (formData: Partial<IProject>) => {
    if (!workspaceSlug && !projectId) return;
    handleChange(formData);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h3 className="text-16 font-medium leading-6 text-primary">Customize time range</h3>
          <div className="mt-8 flex items-center gap-2">
            <div className="flex w-full flex-col justify-center gap-1">
              {type === "auto-close" ? (
                <>
                  <Controller
                    control={control}
                    name="close_in"
                    rules={{
                      required: "Select a month between 1 and 12.",
                      min: 1,
                      max: 12,
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <div className="relative flex w-full flex-col justify-center gap-1">
                        <Input
                          id="close_in"
                          name="close_in"
                          type="number"
                          value={value?.toString()}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.close_in)}
                          placeholder="Enter Months"
                          className="w-full border-subtle"
                          min={1}
                          max={12}
                        />
                        <span className="absolute right-8 top-2.5 text-13 text-secondary">Months</span>
                      </div>
                    )}
                  />

                  {errors.close_in && (
                    <span className="px-1 text-13 text-danger-primary">Select a month between 1 and 12.</span>
                  )}
                </>
              ) : (
                <>
                  <Controller
                    control={control}
                    name="archive_in"
                    rules={{
                      required: "Select a month between 1 and 12.",
                      min: 1,
                      max: 12,
                    }}
                    render={({ field: { value, onChange, ref } }) => (
                      <div className="relative flex w-full flex-col justify-center gap-1">
                        <Input
                          id="archive_in"
                          name="archive_in"
                          type="number"
                          value={value?.toString()}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.archive_in)}
                          placeholder="Enter Months"
                          className="w-full border-subtle"
                          min={1}
                          max={12}
                        />
                        <span className="absolute right-8 top-2.5 text-13 text-secondary">Months</span>
                      </div>
                    )}
                  />
                  {errors.archive_in && (
                    <span className="px-1 text-13 text-danger-primary">Select a month between 1 and 12.</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
