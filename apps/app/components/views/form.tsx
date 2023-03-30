import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton, SecondaryButton, TextArea } from "components/ui";
// components
import { FilterList } from "components/core";
// types
import { IView } from "types";
// constant
import { STATE_LIST } from "constants/fetch-keys";

// services
import stateService from "services/state.service";
// components
import { SelectFilters } from "components/views";

type Props = {
  handleFormSubmit: (values: IView) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  data?: IView;
  preLoadedData?: Partial<IView> | null;
};

const defaultValues: Partial<IView> = {
  name: "",
  description: "",
};

export const ViewForm: React.FC<Props> = ({
  handleFormSubmit,
  handleClose,
  status,
  data,
  preLoadedData,
}) => {
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
    reset({
      ...defaultValues,
      ...preLoadedData,
    });
  }, [preLoadedData, reset]);

  const filters = watch("query");

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
