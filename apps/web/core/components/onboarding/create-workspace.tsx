/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// constants
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUser, IWorkspace, TOnboardingSteps } from "@plane/types";
// ui
import { CustomSelect, Spinner } from "@plane/ui";
import { validateWorkspaceName, validateSlug } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserProfile, useUserSettings } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/services/workspace.service";

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
          <span className="flex w-full items-center gap-2 bg-surface-2 text-14">
            <Button
              variant="ghost"
              size="lg"
              stretch="full"
              onClick={handleCurrentViewChange}
              label={`I want to join invited workspaces (${invitedWorkspaces})`}
            />
          </span>
          <div className="mx-auto mt-4 flex items-center sm:w-96">
            <hr className="w-full border-strong" />
            <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder">or</p>
            <hr className="w-full border-strong" />
          </div>
        </>
      )}
      <div className="mx-auto space-y-1 py-4 text-center">
        <h3 className="text-24 font-bold text-primary">{t("workspace_creation.heading")}</h3>
        <p className="font-medium text-placeholder">{t("workspace_creation.subheading")}</p>
      </div>
      <form className="mx-auto mt-2 w-full space-y-4" onSubmit={handleSubmit(handleCreateWorkspace)}>
        <div className="space-y-1">
          <label
            className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
            htmlFor="name"
          >
            {t("workspace_creation.form.name.label")}
          </label>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("common.errors.required"),
              validate: (value) => validateWorkspaceName(value, true),
              maxLength: {
                value: 80,
                message: t("workspace_creation.errors.validation.name_length"),
              },
            }}
            render={({ field: { value, ref, onChange } }) => (
              <div className="relative flex items-center rounded-md">
                <Field name="name" invalid={Boolean(errors.name)}>
                  <InputGroup size="2xl">
                    <Input
                      size="2xl"
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
                      autoFocus
                    />
                  </InputGroup>
                </Field>
              </div>
            )}
          />
          {errors.name && <span className="text-13 text-danger-primary">{errors.name.message}</span>}
        </div>
        <div className="space-y-1">
          <label
            className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
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
              <Field name="slug" invalid={invalidSlug || Boolean(errors.slug)}>
                <InputGroup size="2xl">
                  <span className="text-13 whitespace-nowrap">{window && window.location.host}/</span>
                  <Input
                    size="2xl"
                    id="slug"
                    name="slug"
                    type="text"
                    value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
                    onChange={(e) => {
                      const validation = validateSlug(e.target.value);
                      if (validation === true) setInvalidSlug(false);
                      else setInvalidSlug(true);
                      onChange(e.target.value.toLowerCase());
                    }}
                    ref={ref}
                    placeholder={t("workspace_creation.form.url.placeholder")}
                  />
                </InputGroup>
              </Field>
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
            className="text-13 font-medium text-tertiary after:ml-0.5 after:text-danger-primary after:content-['*']"
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
        <Button
          variant="primary"
          type="submit"
          size="lg"
          disabled={isButtonDisabled}
          stretch="full"
          loading={isSubmitting}
          label={t("workspace_creation.button.default")}
        />
      </form>
    </div>
  );
});
