import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, Input, PrimaryButton } from "components/ui";
// types
import { ICurrentUserResponse, IWorkspace } from "types";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";
// constants
import { COMPANY_SIZE } from "constants/workspace";

type Props = {
  onSubmit: (res: IWorkspace) => void;
  defaultValues: {
    name: string;
    slug: string;
    company_size: number | null;
  };
  setDefaultValues: Dispatch<SetStateAction<any>>;
  user: ICurrentUserResponse | undefined;
};

const restrictedUrls = [
  "api",
  "create-workspace",
  "error",
  "installations",
  "invitations",
  "magic-sign-in",
  "onboarding",
  "signin",
  "workspace-member-invitation",
  "404",
];

export const CreateWorkspaceForm: React.FC<Props> = ({
  onSubmit,
  defaultValues,
  setDefaultValues,
  user,
}) => {
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);

  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({ defaultValues });

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !restrictedUrls.includes(formData.slug)) {
          setSlugError(false);
          await workspaceService
            .createWorkspace(formData, user)
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

  useEffect(
    () => () => {
      // when the component unmounts set the default values to whatever user typed in
      setDefaultValues(getValues());
    },
    [getValues, setDefaultValues]
  );

  return (
    <form className="flex h-full w-full flex-col" onSubmit={handleSubmit(handleCreateWorkspace)}>
      <div className="divide-y h-[255px]">
        <div className="flex flex-col justify-between gap-3.5 px-7 pb-3.5">
          <div className="flex flex-col items-start justify-center gap-2.5">
            <span className="text-sm">Workspace name</span>
            <Input
              name="name"
              register={register}
              autoComplete="off"
              onChange={(e) =>
                setValue("slug", e.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"))
              }
              validations={{
                required: "Workspace name is required",
                validate: (value) =>
                  /^[\w\s-]*$/.test(value) ||
                  `Name can only contain (" "), ( - ), ( _ ) & Alphanumeric characters.`,
              }}
              placeholder="e.g. My Workspace"
              className="placeholder:text-brand-secondary"
              error={errors.name}
            />
          </div>
          <div className="flex flex-col items-start justify-center gap-2.5">
            <span className="text-sm">Workspace URL</span>
            <div className="flex w-full items-center rounded-md border border-brand-base px-3">
              <span className="whitespace-nowrap text-sm text-brand-secondary">
                {typeof window !== "undefined" && window.location.origin}/
              </span>
              <Input
                mode="trueTransparent"
                autoComplete="off"
                name="slug"
                register={register}
                className="block w-full rounded-md bg-transparent py-2 !px-0 text-sm"
                validations={{
                  required: "Workspace URL is required",
                }}
                onChange={(e) =>
                  /^[a-zA-Z0-9_-]+$/.test(e.target.value)
                    ? setInvalidSlug(false)
                    : setInvalidSlug(true)
                }
              />
            </div>
            {slugError && (
              <span className="-mt-3 text-sm text-red-500">Workspace URL is already taken!</span>
            )}
            {invalidSlug && (
              <span className="text-sm text-red-500">{`URL can only contain ( - ), ( _ ) & Alphanumeric characters.`}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2.5 border-t border-brand-base px-7 pt-3.5 ">
          <span className="text-sm">How large is your company?</span>
          <div className="w-full">
            <Controller
              name="company_size"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    value ? (
                      value.toString()
                    ) : (
                      <span className="text-brand-secondary">Select company size</span>
                    )
                  }
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

      <div className="flex w-full items-center justify-center rounded-b-[10px] pt-10">
        <PrimaryButton
          type="submit"
          className="flex w-1/2 items-center justify-center text-center"
          size="md"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Workspace"}
        </PrimaryButton>
      </div>
    </form>
  );
};
