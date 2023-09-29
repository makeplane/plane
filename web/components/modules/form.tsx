import { useEffect } from "react";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// components
import { ModuleLeadSelect, ModuleMembersSelect, ModuleStatusSelect } from "components/modules";
// ui
import { DateSelect, Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IModule } from "types";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  handleFormSubmit: (values: Partial<IModule>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IModule;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead: null,
  members_list: [],
};

export const ModuleForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const store: RootStore = useMobxStore();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    control,
    reset,
  } = useForm<IModule>({
    defaultValues,
  });

  const handleCreateUpdateModule = async (formData: Partial<IModule>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {status
            ? store.locale.localized("Update Module")
            : store.locale.localized("Create Module")}
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              name="name"
              type="name"
              placeholder={store.locale.localized("Title")}
              autoComplete="off"
              className="resize-none text-xl"
              error={errors.name}
              register={register}
              validations={{
                required: store.locale.localized("Title is required"),
                maxLength: {
                  value: 255,
                  message: store.locale.localized("Title should be less than 255 characters"),
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
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value, onChange } }) => (
                <DateSelect
                  label={store.locale.localized("Start date")}
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                  }}
                  maxDate={maxDate ?? undefined}
                />
              )}
            />
            <Controller
              control={control}
              name="target_date"
              render={({ field: { value, onChange } }) => (
                <DateSelect
                  label={store.locale.localized("Target date")}
                  value={value}
                  onChange={(val) => {
                    onChange(val);
                  }}
                  minDate={minDate ?? undefined}
                />
              )}
            />
            <ModuleStatusSelect control={control} error={errors.status} />
            <Controller
              control={control}
              name="lead"
              render={({ field: { value, onChange } }) => (
                <ModuleLeadSelect value={value} onChange={onChange} />
              )}
            />
            <Controller
              control={control}
              name="members"
              render={({ field: { value, onChange } }) => (
                <ModuleMembersSelect value={value} onChange={onChange} />
              )}
            />
          </div>
        </div>
      </div>
      <div className="-mx-5 mt-5 flex justify-end gap-2 border-t border-custom-border-200 px-5 pt-5">
        <SecondaryButton onClick={handleClose}>{store.locale.localized("Cancel")}</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? store.locale.localized("Updating Module...")
              : store.locale.localized("Update Module")
            : isSubmitting
            ? store.locale.localized("Creating Module...")
            : store.locale.localized("Create Module")}
        </PrimaryButton>
      </div>
    </form>
  );
};
