import { useEffect } from "react";
import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// types
import { IPageForm } from "types";

type Props = {
  handleFormSubmit: (values: IPageForm) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IPageForm;
};

const defaultValues: IPageForm = {
  name: "",
  description: "",
};

export const PageForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IPageForm>({
    defaultValues,
  });

  const handleCreateUpdatePage = async (formData: IPageForm) => {
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
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} Page
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              label="Name"
              name="name"
              type="name"
              placeholder="Enter name"
              autoComplete="off"
              error={errors.name}
              register={register}
              validations={{
                required: "Name is required",
                maxLength: {
                  value: 255,
                  message: "Name should be less than 255 characters",
                },
              }}
            />
          </div>
          <div>
            <TextArea
              id="description"
              name="description"
              label="Description"
              placeholder="Enter description"
              error={errors.description}
              register={register}
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
