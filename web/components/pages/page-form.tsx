import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
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
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
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
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{status ? "Update" : "Create"} Page</h3>
        <div className="space-y-3">
          <div>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Title"
                  className="resize-none text-xl w-full"
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="neutral-primary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? "Updating Page..."
              : "Update Page"
            : isSubmitting
            ? "Creating Page..."
            : "Create Page"}
        </Button>
      </div>
    </form>
  );
};
