import { useEffect } from "react";


import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// components
import { FilterList } from "components/core";
// types
import { IView } from "types";
// components
import { SelectFilters } from "components/views";

type Props = {
  handleFormSubmit: (values: IView) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IView | null;
};

const defaultValues: Partial<IView> = {
  name: "",
  description: "",
};

export const ViewForm: React.FC<Props> = ({ handleFormSubmit, handleClose, status, data }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<IView>({
    defaultValues,
  });
  const filters = watch("query");

  const handleCreateUpdateView = async (formData: IView) => {
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

  useEffect(() => {
    if (status && data) {
      setValue("query", data.query_data);
    }
  }, [data, status, setValue]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {status ? "Update" : "Create"} View
        </h3>
        <div className="space-y-3">
          <div>
            <Input
              id="name"
              name="name"
              type="name"
              placeholder="Title"
              autoComplete="off"
              mode="transparent"
              className="resize-none text-xl"
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
          <div>
            <TextArea
              id="description"
              name="description"
              placeholder="Description"
              className="h-32 resize-none text-sm"
              mode="transparent"
              error={errors.description}
              register={register}
            />
          </div>
          <div>
            <SelectFilters
              filters={filters}
              onSelect={(option) => {
                const key = option.key as keyof typeof filters;

                if (!filters?.[key]?.includes(option.value))
                  setValue("query", {
                    ...filters,
                    [key]: [...((filters?.[key] as any[]) ?? []), option.value],
                  });
                else {
                  setValue("query", {
                    ...filters,
                    [key]: (filters?.[key] as any[])?.filter((item) => item !== option.value),
                  });
                }
              }}
            />
          </div>
          <div>
            <FilterList
              filters={filters}
              setFilters={(query: any) => {
                setValue("query", {
                  ...filters,
                  ...query,
                });
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
              ? "Updating View..."
              : "Update View"
            : isSubmitting
            ? "Creating View..."
            : "Create View"}
        </PrimaryButton>
      </div>
    </form>
  );
};
