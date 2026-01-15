import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// constants
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// ui
import { CustomSelect, Input, Spinner } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserProfile, useUserSettings } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/plane-web/services";

type Props = {
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  user: IUser | undefined;
  invitedWorkspaces: number;
  handleCurrentViewChange: () => void;
};

// services
const workspaceService = new WorkspaceService();

export const CreateWorkspace = observer(function CreateWorkspace(props: Props) {
  const { stepChange, user, invitedWorkspaces, handleCurrentViewChange } = props;
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { updateUserProfile } = useUserProfile();
  const { fetchCurrentUserSettings } = useUserSettings();
  const { createWorkspace, fetchWorkspaces } = useWorkspace();
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
      const res = await workspaceService.workspaceSlugCheck(formData.slug);
      if (res?.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
        setSlugError(false);
        const workspaceResponse = await createWorkspace(formData);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_creation.toast.success.title"),
          message: t("workspace_creation.toast.success.message"),
        });
        await fetchWorkspaces();
        await completeStep(workspaceResponse.id);
      } else setSlugError(true);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_creation.toast.error.title"),
        message: t("workspace_creation.toast.error.message"),
      });
    }
  };

  const completeStep = async (workspaceId: string) => {
    if (!user) return;
    const payload: Partial<TOnboardingSteps> = {
      workspace_create: true,
      workspace_join: true,
    };

    await stepChange(payload);
    await updateUserProfile({
      last_workspace_id: workspaceId,
    });
    await fetchCurrentUserSettings();
  };

  const isButtonDisabled = !isValid || invalidSlug || isSubmitting;

  return (
    <div className="space-y-4">
      {!!invitedWorkspaces && (
        <>
          <Button
            variant="ghost"
            size="xl"
            className="w-full flex items-center gap-2 text-14 bg-surface-2"
            onClick={handleCurrentViewChange}
          >
            I want to join invited workspaces{" "}
            <span className="bg-accent-primary/80 h-4 w-4 flex items-center justify-center rounded-xs text-11 font-medium text-on-color">
              {invitedWorkspaces}
            </span>
          </Button>
          <div className="mx-auto mt-4 flex items-center sm:w-96">
            <hr className="w-full border-strong" />
            <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder">or</p>
            <hr className="w-full border-strong" />
          </div>
        </>
      )}
      <div className="text-center space-y-1 py-4 mx-auto">
        <h3 className="text-24 font-bold text-primary">{t("workspace_creation.heading")}</h3>
        <p className="font-medium text-placeholder">{t("workspace_creation.subheading")}</p>
      </div>
      <form className="w-full mx-auto mt-2 space-y-4" onSubmit={handleSubmit(handleCreateWorkspace)}>
        <div className="space-y-1">
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
                <Input
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
                  placeholder={t("workspace_creation.form.name.placeholder")}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  className="w-full border-strong placeholder:text-placeholder"
                  autoFocus
                />
              </div>
            )}
          />
          {errors.name && <span className="text-13 text-danger-primary">{errors.name.message}</span>}
        </div>
        <div className="space-y-1">
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
                className={`relative flex items-center rounded-md border-[0.5px] px-3 ${
                  invalidSlug ? "border-danger-strong" : "border-strong"
                }`}
              >
                <span className="whitespace-nowrap text-13">{window && window.location.host}/</span>
                <Input
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
                  hasError={Boolean(errors.slug)}
                  placeholder={t("workspace_creation.form.url.placeholder")}
                  className="w-full border-none !px-0"
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
        <hr className="w-full border-strong" />
        <div className="space-y-1">
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
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={
                    ORGANIZATION_SIZE.find((c) => c === value) ?? (
                      <span className="text-placeholder">
                        {t("workspace_creation.form.organization_size.placeholder")}
                      </span>
                    )
                  }
                  buttonClassName="border border-subtle bg-layer-2 !shadow-none !rounded-md"
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
        <Button variant="primary" type="submit" size="xl" className="w-full" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("workspace_creation.button.default")}
        </Button>
      </form>
    </div>
  );
});
