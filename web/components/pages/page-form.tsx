import { useEffect } from "react";

// react-hook-form
import { useForm } from "react-hook-form";
// ui
import { Input, Loader, PrimaryButton, SecondaryButton } from "components/ui";
// types
import { IPage } from "types";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  handleFormSubmit: (values: IPage) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IPage | null;
};

const defaultValues = {
  name: "",
  description: "",
};

export const PageForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const store: RootStore = useMobxStore();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IPage>({
    defaultValues,
  });

  const handleCreateUpdatePage = async (formData: IPage) => {
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

  return (
    <form onSubmit={handleSubmit(handleCreateUpdatePage)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {status ? store.locale.localized("Update Page") : store.locale.localized("Create Page")}
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              name="name"
              type="name"
              placeholder={store.locale.localized("Title")}
              className="resize-none text-xl"
              autoComplete="off"
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
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton onClick={handleClose}>{store.locale.localized("Cancel")}</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? store.locale.localized("Updating Page...")
              : store.locale.localized("Update Page")
            : isSubmitting
            ? store.locale.localized("Creating Page...")
            : store.locale.localized("Create Page")}
        </PrimaryButton>
      </div>
    </form>
  );
};
