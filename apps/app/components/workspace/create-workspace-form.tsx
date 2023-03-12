import { useEffect, useState } from "react";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, Input } from "components/ui";
// types
import { IWorkspace } from "types";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";
// constants
import { COMPANY_SIZE } from "constants/workspace";

type Props = {
  onSubmit: (res: IWorkspace) => void;
};

const defaultValues = {
  name: "",
  slug: "",
  company_size: null,
};

export const CreateWorkspaceForm: React.FC<Props> = ({ onSubmit }) => {
  const [slugError, setSlugError] = useState(false);

  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({ defaultValues });

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true) {
          setSlugError(false);
          await workspaceService
            .createWorkspace(formData)
            .then((res) => {
              setToastAlert({
                type: "success",
                title: "Success!",
                message: "Workspace created successfully.",
              });
              mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) => [res, ...(prevData ?? [])]);
              onSubmit(res);
            })
            .catch((err) => {
              console.error(err);
            });
        } else setSlugError(true);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred while creating workspace. Please try again.",
        });
      });
  };

  useEffect(() => {
    reset(defaultValues);
  }, [reset]);

  return (
    <form className="space-y-8" onSubmit={handleSubmit(handleCreateWorkspace)}>
      <div className="w-full space-y-4 bg-white">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Input
              name="name"
              register={register}
              label="Workspace name"
              placeholder="Enter name"
              autoComplete="off"
              onChange={(e) =>
                setValue("slug", e.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"))
              }
              validations={{
                required: "Workspace name is required",
              }}
              error={errors.name}
            />
          </div>
          <div>
            <h6 className="text-gray-500">Workspace slug</h6>
            <div className="flex items-center rounded-md border border-gray-300 px-3">
              <span className="text-sm text-slate-600">{"https://app.plane.so/"}</span>
              <Input
                mode="trueTransparent"
                autoComplete="off"
                name="slug"
                register={register}
                className="block w-full rounded-md bg-transparent py-2 px-0 text-sm"
              />
            </div>
            {slugError && (
              <span className="-mt-3 text-sm text-red-500">Workspace URL is already taken!</span>
            )}
          </div>
          <div>
            <h6 className="text-gray-500">Company size</h6>
            <Controller
              name="company_size"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={value ? value.toString() : "Select company size"}
                  input
                  width="w-full"
                >
                  {COMPANY_SIZE?.map((item) => (
                    <CustomSelect.Option key={item.value} value={item.value}>
                      {item.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.company_size && (
              <span className="text-sm text-red-500">{errors.company_size.message}</span>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto h-1/4 lg:w-1/2">
        <button
          type="submit"
          className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Continue"}
        </button>
      </div>
    </form>
  );
};
