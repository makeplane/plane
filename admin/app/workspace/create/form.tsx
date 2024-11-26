import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// constants
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
// types
import { IWorkspace } from "@plane/types";
// components
import { Button, CustomSelect, getButtonStyling, Input, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { WEB_BASE_URL } from "@/helpers/common.helper";
// hooks
import { useWorkspace } from "@/hooks/store";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

export const WorkspaceCreateForm = () => {
  // router
  const router = useRouter();
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<IWorkspace>>({
    name: "",
    slug: "",
    organization_size: "",
  });
  // store hooks
  const { createWorkspace } = useWorkspace();
  // form info
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({ defaultValues, mode: "onChange" });

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
          setSlugError(false);
          await createWorkspace(formData)
            .then(async () => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success!",
                message: "Workspace created successfully.",
              });
              router.push(`/workspace`);
            })
            .catch(() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Workspace could not be created. Please try again.",
              });
            });
        } else setSlugError(true);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Some error occurred while creating workspace. Please try again.",
        });
      });
  };

  useEffect(
    () => () => {
      // when the component unmounts set the default values to whatever user typed in
      setDefaultValues(getValues());
    },
    [getValues, setDefaultValues]
  );

  return (
    <div className="space-y-8">
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-start justify-between gap-x-10 gap-y-6 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm text-custom-text-300">Workspace Name</h4>
          <div className="flex flex-col gap-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Workspace name is required",
                validate: (value) =>
                  /^[\w\s-]*$/.test(value) || `Name can only contain (" "), ( - ), ( _ ) & alphanumeric characters.`,
                maxLength: {
                  value: 80,
                  message: "Workspace name should not exceed 80 characters",
                },
              }}
              render={({ field: { value, ref, onChange } }) => (
                <Input
                  id="workspaceName"
                  type="text"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setValue("name", e.target.value);
                    setValue("slug", e.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"), {
                      shouldValidate: true,
                    });
                  }}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Enter workspace name..."
                  className="w-full"
                />
              )}
            />
            <span className="text-xs text-red-500">{errors?.name?.message}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm text-custom-text-300">Workspace URL</h4>
          <div className="flex gap-0.5 w-full items-center rounded-md border-[0.5px] border-custom-border-200 px-3">
            <span className="whitespace-nowrap text-sm text-custom-text-200">{WEB_BASE_URL}/</span>
            <Controller
              control={control}
              name="slug"
              rules={{
                required: "Workspace slug is required",
                maxLength: {
                  value: 48,
                  message: "Workspace slug should not exceed 48 characters",
                },
              }}
              render={({ field: { onChange, value, ref } }) => (
                <Input
                  id="workspaceUrl"
                  type="text"
                  value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                  onChange={(e) => {
                    if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                    else setInvalidSlug(true);
                    onChange(e.target.value.toLowerCase());
                  }}
                  ref={ref}
                  hasError={Boolean(errors.slug)}
                  placeholder="Enter workspace url"
                  className="block w-full rounded-md border-none bg-transparent !px-0 py-2 text-sm"
                />
              )}
            />
          </div>
          {slugError && <p className="text-sm text-red-500">Workspace URL is already taken!</p>}
          {invalidSlug && (
            <p className="text-sm text-red-500">{`URL can only contain ( - ), ( _ ) & alphanumeric characters.`}</p>
          )}
          {errors.slug && <span className="text-xs text-red-500">{errors.slug.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm text-custom-text-300">What size is your organization?</h4>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-custom-text-400">Select organization size</span>
                    )
                  }
                  buttonClassName="!border-[0.5px] !border-custom-border-200 !shadow-none"
                  input
                  optionsClassName="w-full"
                >
                  {ORGANIZATION_SIZE.map((item) => (
                    <CustomSelect.Option key={item} value={item}>
                      {item}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
            {errors.organization_size && (
              <span className="text-sm text-red-500">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex max-w-4xl items-center py-1 gap-4">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit(handleCreateWorkspace)}
          disabled={!isValid}
          loading={isSubmitting}
        >
          {isSubmitting ? "Creating" : "Create Workspace"}
        </Button>
        <Link className={getButtonStyling("link-neutral", "sm")} href="/workspace">
          Go back
        </Link>
      </div>
    </div>
  );
};
