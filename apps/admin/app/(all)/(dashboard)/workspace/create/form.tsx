import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { WEB_BASE_URL, ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { InstanceWorkspaceService } from "@plane/services";
import type { IWorkspace } from "@plane/types";
// components
import { CustomSelect, Input } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store";

const instanceWorkspaceService = new InstanceWorkspaceService();

export function WorkspaceCreateForm() {
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
  // derived values
  const workspaceBaseURL = encodeURI(WEB_BASE_URL || window.location.origin + "/");

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await instanceWorkspaceService
      .slugCheck(formData.slug)
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
          <h4 className="text-13 text-tertiary">Name your workspace</h4>
          <div className="flex flex-col gap-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: "This is a required field.",
                validate: (value) =>
                  /^[\w\s-]*$/.test(value) ||
                  `Workspaces names can contain only (" "), ( - ), ( _ ) and alphanumeric characters.`,
                maxLength: {
                  value: 80,
                  message: "Limit your name to 80 characters.",
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
                  placeholder="Something familiar and recognizable is always best."
                  className="w-full"
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">Set your workspace&apos;s URL</h4>
          <div className="flex gap-0.5 w-full items-center rounded-md border-[0.5px] border-subtle px-3">
            <span className="whitespace-nowrap text-13 text-secondary">{workspaceBaseURL}</span>
            <Controller
              control={control}
              name="slug"
              rules={{
                required: "The URL is a required field.",
                maxLength: {
                  value: 48,
                  message: "Limit your URL to 48 characters.",
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
                  placeholder="workspace-name"
                  className="block w-full rounded-md border-none bg-transparent !px-0 py-2 text-13"
                />
              )}
            />
          </div>
          {slugError && <p className="text-13 text-danger-primary">This URL is taken. Try something else.</p>}
          {invalidSlug && (
            <p className="text-13 text-danger-primary">{`URLs can contain only ( - ), ( _ ) and alphanumeric characters.`}</p>
          )}
          {errors.slug && <span className="text-11 text-danger-primary">{errors.slug.message}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-13 text-tertiary">How many people will use this workspace?</h4>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "This is a required field." }}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-placeholder">Select a range</span>
                    )
                  }
                  buttonClassName="!border-[0.5px] !border-subtle !shadow-none"
                  input
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
              <span className="text-13 text-danger-primary">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex max-w-4xl items-center py-1 gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit(handleCreateWorkspace)}
          disabled={!isValid}
          loading={isSubmitting}
        >
          {isSubmitting ? "Creating workspace" : "Create workspace"}
        </Button>
        <Link className={getButtonStyling("secondary", "lg")} href="/workspace">
          Go back
        </Link>
      </div>
    </div>
  );
}
