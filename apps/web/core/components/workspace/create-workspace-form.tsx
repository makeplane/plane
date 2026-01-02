import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
// ui
import { CustomSelect, Input } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { WorkspaceService } from "@/plane-web/services";

type Props = {
  onSubmit?: (res: IWorkspace) => Promise<void>;
  defaultValues: {
    name: string;
    slug: string;
    organization_size: string;
  };
  setDefaultValues: Dispatch<SetStateAction<Pick<IWorkspace, "name" | "slug" | "organization_size">>>;
  secondaryButton?: React.ReactNode;
  primaryButtonText?: {
    loading: string;
    default: string;
  };
};

const workspaceService = new WorkspaceService();

export const CreateWorkspaceForm = observer(function CreateWorkspaceForm(props: Props) {
  const { t } = useTranslation();
  const {
    onSubmit,
    defaultValues,
    setDefaultValues,
    secondaryButton,
    primaryButtonText = {
      loading: "workspace_creation.button.loading",
      default: "workspace_creation.button.default",
    },
  } = props;
  // states
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);
  // router
  const router = useAppRouter();
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

          if (onSubmit) await onSubmit(workspaceResponse);
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

  useEffect(
    () => () => {
      // when the component unmounts set the default values to whatever user typed in
      setDefaultValues(getValues());
    },
    [getValues, setDefaultValues]
  );

  return (
    <form
      className="space-y-6 sm:space-y-9"
      onSubmit={(e) => {
        void handleSubmit(handleCreateWorkspace)(e);
      }}
    >
      <div className="space-y-6 sm:space-y-7">
        <div className="flex flex-col gap-2 text-13">
          <label htmlFor="workspaceName">
            {t("workspace_creation.form.name.label")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </label>
          <div className="flex flex-col gap-1">
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
                  placeholder={t("workspace_creation.form.name.placeholder")}
                  className="w-full"
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-13">
          <label htmlFor="workspaceUrl">
            {t("workspace_creation.form.url.label")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </label>
          <div className="flex w-full items-center rounded-md border border-subtle px-3 bg-layer-2">
            <span className="whitespace-nowrap text-12 text-secondary">{window && window.location.host}/</span>
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
                  placeholder={t("workspace_creation.form.url.placeholder")}
                  className="block w-full rounded-md border-none bg-transparent !px-0 py-2 text-12"
                />
              )}
            />
          </div>
          {slugError && (
            <p className="-mt-3 text-13 text-danger-primary">
              {t("workspace_creation.errors.validation.url_already_taken")}
            </p>
          )}
          {invalidSlug && (
            <p className="text-13 text-danger-primary">{t("workspace_creation.errors.validation.url_alphanumeric")}</p>
          )}
          {errors.slug && <span className="text-11 text-danger-primary">{errors.slug.message}</span>}
        </div>
        <div className="flex flex-col gap-2 text-13">
          <span>
            {t("workspace_creation.form.organization_size.label")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </span>
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
      </div>
      <div className="flex items-center gap-4">
        {secondaryButton}
        <Button variant="primary" type="submit" size="xl" disabled={!isValid} loading={isSubmitting}>
          {isSubmitting ? t(primaryButtonText.loading) : t(primaryButtonText.default)}
        </Button>
        {!secondaryButton && (
          <Button variant="secondary" type="button" size="xl" onClick={() => router.back()}>
            {t("common.go_back")}
          </Button>
        )}
      </div>
    </form>
  );
});
