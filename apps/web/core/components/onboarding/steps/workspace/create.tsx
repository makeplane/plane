import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { CircleCheck } from "lucide-react";
// plane imports
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IWorkspace } from "@plane/types";
import { Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserProfile, useUserSettings } from "@/hooks/store/user";
// plane-web imports
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";
import { WorkspaceService } from "@/plane-web/services";
// local components
import { CommonOnboardingHeader } from "../common";

type Props = {
  user: IUser | undefined;
  onComplete: (skipInvites?: boolean) => void;
  handleCurrentViewChange: () => void;
  hasInvitations?: boolean;
};

const workspaceService = new WorkspaceService();

export const WorkspaceCreateStep = observer(function WorkspaceCreateStep({
  user,
  onComplete,
  handleCurrentViewChange,
  hasInvitations = false,
}: Props) {
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { updateUserProfile } = useUserProfile();
  const { fetchCurrentUserSettings } = useUserSettings();
  const { createWorkspace, fetchWorkspaces } = useWorkspace();

  const isWorkspaceCreationEnabled = getIsWorkspaceCreationDisabled() === false;

  // form info
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IWorkspace>({
    defaultValues: {
      name: "",
      slug: "",
      organization_size: "",
    },
    mode: "onChange",
  });

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    if (isSubmitting) return;

    try {
      const res = (await workspaceService.workspaceSlugCheck(formData.slug)) as { status: boolean };
      if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
        setSlugError(false);
        try {
          const workspaceResponse = await createWorkspace(formData);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("workspace_creation.toast.success.title"),
            message: t("workspace_creation.toast.success.message"),
          });
          await fetchWorkspaces();
          await completeStep(workspaceResponse.id);
          onComplete(formData.organization_size === "Just myself");
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("workspace_creation.toast.error.title"),
            message: t("workspace_creation.toast.error.message"),
          });
        }
      } else {
        setSlugError(true);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_creation.toast.error.title"),
        message: t("workspace_creation.toast.error.message"),
      });
    }
  };

  const completeStep = async (workspaceId: string) => {
    if (!user) return;
    await updateUserProfile({
      last_workspace_id: workspaceId,
    });
    await fetchCurrentUserSettings();
  };

  const isButtonDisabled = !isValid || invalidSlug || isSubmitting;

  if (!isWorkspaceCreationEnabled) {
    return (
      <div className="flex flex-col gap-10">
        <span className="text-center text-14 text-tertiary">
          You don&apos;t seem to have any invites to a workspace and your instance admin has restricted creation of new
          workspaces. Please ask a workspace owner or admin to invite you to a workspace first and come back to this
          screen to join.
        </span>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-10"
      onSubmit={(e) => {
        void handleSubmit(handleCreateWorkspace)(e);
      }}
    >
      <CommonOnboardingHeader title="Create your workspace" description="All your work — unified." />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label
            className="text-13 text-tertiary font-medium after:content-['*'] after:ml-0.5 after:text-danger-primary"
            htmlFor="name"
          >
            {t("workspace_creation.form.name.label")}
          </label>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("common.errors.required"),
              validate: (value) =>
                /^[\w\s-]*$/.test(value) || t("workspace_creation.errors.validation.name_alphanumeric"),
              maxLength: {
                value: 80,
                message: t("workspace_creation.errors.validation.name_length"),
              },
            }}
            render={({ field: { value, ref, onChange } }) => (
              <div className="relative flex items-center rounded-md">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={value}
                  onChange={(event) => {
                    onChange(event.target.value);
                    setValue("name", event.target.value);
                    setValue("slug", event.target.value.toLocaleLowerCase().trim().replace(/ /g, "-"), {
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Enter workspace name"
                  ref={ref}
                  className={cn(
                    "w-full px-3 py-2 text-secondary border border-strong rounded-md bg-surface-1 focus:outline-none focus:ring-2 focus:ring-accent-strong placeholder:text-placeholder focus:border-transparent transition-all duration-200",
                    {
                      "border-strong": !errors.name,
                      "border-danger-strong": errors.name,
                    }
                  )}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            )}
          />
          {errors.name && <span className="text-13 text-danger-primary">{errors.name.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-13 text-tertiary font-medium after:content-['*'] after:ml-0.5 after:text-danger-primary"
            htmlFor="slug"
          >
            {t("workspace_creation.form.url.label")}
          </label>
          <Controller
            control={control}
            name="slug"
            rules={{
              required: t("common.errors.required"),
              maxLength: {
                value: 48,
                message: t("workspace_creation.errors.validation.url_length"),
              },
            }}
            render={({ field: { value, ref, onChange } }) => (
              <div
                className={cn(
                  "flex items-center w-full px-3 py-2 text-secondary border border-strong rounded-md bg-surface-1 focus:outline-none focus:ring-2 focus:ring-accent-strong focus:border-transparent transition-all duration-200",
                  {
                    "border-strong": !errors.name,
                    "border-danger-strong": errors.name,
                  }
                )}
              >
                <span className={cn("pr-0 text-secondary rounded-md whitespace-nowrap")}>
                  {window && window.location.host}/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                  onChange={(e) => {
                    if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                    else setInvalidSlug(true);
                    onChange(e.target.value.toLowerCase());
                  }}
                  ref={ref}
                  placeholder={t("workspace_creation.form.url.placeholder")}
                  className={cn(
                    "w-full px-3 py-0 pl-0 text-secondary border-none ring-none outline-none rounded-md bg-surface-1 placeholder:text-placeholder"
                  )}
                />
              </div>
            )}
          />
          <p className="text-13 text-tertiary">{t("workspace_creation.form.url.edit_slug")}</p>
          {slugError && (
            <p className="-mt-3 text-13 text-danger-primary">
              {t("workspace_creation.errors.validation.url_already_taken")}
            </p>
          )}
          {invalidSlug && (
            <p className="text-13 text-danger-primary">{t("workspace_creation.errors.validation.url_alphanumeric")}</p>
          )}
          {errors.slug && <span className="text-13 text-danger-primary">{errors.slug.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-13 text-tertiary font-medium after:content-['*'] after:ml-0.5 after:text-danger-primary"
            htmlFor="organization_size"
          >
            {t("workspace_creation.form.organization_size.label")}
          </label>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: t("common.errors.required") }}
              render={({ field: { value, onChange } }) => (
                <div className="flex flex-wrap gap-3">
                  {ORGANIZATION_SIZE.map((size) => {
                    const isSelected = value === size;
                    return (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(size);
                        }}
                        className={`text-13 px-3 py-2 rounded-lg border transition-all duration-200 flex gap-1 items-center justify-between ${
                          isSelected
                            ? "border-subtle bg-layer-1 text-secondary"
                            : "border-subtle hover:border-strong text-tertiary"
                        }`}
                      >
                        <CircleCheck className={cn("size-4 text-placeholder", isSelected && "text-secondary")} />

                        <span className="font-medium">{size}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.organization_size && (
              <span className="text-13 text-danger-primary">{errors.organization_size.message}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Button variant="primary" type="submit" size="xl" className="w-full" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("workspace_creation.button.default")}
        </Button>
        {hasInvitations && (
          <Button variant="ghost" size="xl" className="w-full" onClick={handleCurrentViewChange}>
            Join existing workspace
          </Button>
        )}
      </div>
    </form>
  );
});
