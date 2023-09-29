import { useEffect } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";

// ui
import { DateSelect, Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { ICycle } from "types";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  handleFormSubmit: (values: Partial<ICycle>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: ICycle | null;
};

const defaultValues: Partial<ICycle> = {
  name: "",
  description: "",
  start_date: null,
  end_date: null,
};

export const CycleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const store: RootStore = useMobxStore();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
    watch,
  } = useForm<ICycle>({
    defaultValues,
  });

  const handleCreateUpdateCycle = async (formData: Partial<ICycle>) => {
    await handleFormSubmit(formData);
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const minDate = startDate ? new Date(startDate) : new Date();
  minDate.setDate(minDate.getDate() + 1);

  const maxDate = endDate ? new Date(endDate) : null;
  maxDate?.setDate(maxDate.getDate() - 1);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateCycle)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {status ? store.locale.localized("Update cycle") : store.locale.localized("Create cycle")}
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              autoComplete="off"
              id="name"
              name="name"
              type="name"
              className="resize-none text-xl"
              placeholder={store.locale.localized("Name")}
              error={errors.name}
              register={register}
              validations={{
                required: store.locale.localized("Name is required"),
                maxLength: {
                  value: 255,
                  message: store.locale.localized("Name cannot be more than 255 characters"),
                },
              }}
            />
          </div>
          <div>
            <TextArea
              id="description"
              name="description"
              placeholder={store.locale.localized("Description")}
              className="h-32 resize-none text-sm"
              error={errors.description}
              register={register}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect
                    label={store.locale.localized("Start date")}
                    value={value}
                    onChange={(val) => onChange(val)}
                    minDate={new Date()}
                    maxDate={maxDate ?? undefined}
                  />
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="end_date"
                render={({ field: { value, onChange } }) => (
                  <DateSelect
                    label={store.locale.localized("End date")}
                    value={value}
                    onChange={(val) => onChange(val)}
                    minDate={minDate}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-custom-border-200 px-5 pt-5">
        <SecondaryButton onClick={handleClose}>{store.locale.localized("Cancel")}</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? store.locale.localized("Updating Cycle...")
              : store.locale.localized("Update Cycle")
            : isSubmitting
            ? store.locale.localized("Creating Cycle...")
            : store.locale.localized("Create Cycle")}
        </PrimaryButton>
      </div>
    </form>
  );
};
