import { useEffect } from "react";

// react-hook-form
import { useForm } from "react-hook-form";
// ui
import { Input, Loader, PrimaryButton, SecondaryButton } from "components/ui";
// types
import { IPage } from "types";

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
          {status ? "Update" : "Create"} Page
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              name="name"
              type="name"
              placeholder="Title"
              className="resize-none text-xl"
              autoComplete="off"
              error={errors.name}
              register={register}
              validations={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? "Updating Page..."
              : "Update Page"
            : isSubmitting
            ? "Creating Page..."
            : "Create Page"}
        </PrimaryButton>
      </div>
    </form>
  );
};
