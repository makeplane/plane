/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { WEB_BASE_URL, ORGANIZATION_SIZE, RESTRICTED_URLS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
import { InstanceWorkspaceService } from "@plane/services";
import type { IWorkspace } from "@plane/types";
import { validateSlug, validateWorkspaceName } from "@plane/utils";
// components
import { setToast } from "@plane/blocks/toast";
// hooks
import { useWorkspace } from "@/hooks/store";

const instanceWorkspaceService = new InstanceWorkspaceService();

export function WorkspaceCreateForm() {
  // plane hooks
  const { t } = useTranslation();
  const organizationSizeLabelId = useId();
  const organizationSizeErrorId = useId();
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
  const [workspaceBaseURL, setWorkspaceBaseURL] = useState(() => encodeURI(WEB_BASE_URL || ""));

  useEffect(() => {
    if (!WEB_BASE_URL) {
      setWorkspaceBaseURL(encodeURI(window.location.origin + "/"));
    }
  }, []);

  const handleCreateWorkspace = async (formData: IWorkspace) => {
    await instanceWorkspaceService
      .slugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true && !RESTRICTED_URLS.includes(formData.slug)) {
          setSlugError(false);
          await createWorkspace(formData)
            .then(async () => {
              setToast({
                type: "success",
                title: "Success!",
                message: "Workspace created successfully.",
              });
              router.push(`/workspace`);
            })
            .catch(() => {
              setToast({
                type: "error",
                title: "Error!",
                message: "Workspace could not be created. Please try again.",
              });
            });
        } else setSlugError(true);
      })
      .catch(() => {
        setToast({
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
    <div className="space-y-8">
      <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-start justify-between gap-x-10 gap-y-6 lg:grid-cols-2">
        <Controller
          control={control}
          name="name"
          rules={{
            validate: (value) => validateWorkspaceName(value, true),
          }}
          render={({ field: { value, ref, onChange } }) => (
            <InputField
              size="lg"
              orientation="vertical"
              label={t("workspace_creation.form.name.label")}
              required
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
              placeholder="Something familiar and recognizable is always best."
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="slug"
          rules={{
            validate: (value) => validateSlug(value),
          }}
          render={({ field: { onChange, value, ref } }) => (
            <InputField
              id="workspaceUrl"
              type="text"
              size="lg"
              orientation="vertical"
              label={t("workspace_creation.form.url.label")}
              required
              startIcon={
                <span className="text-body-xs-regular whitespace-nowrap text-secondary">{workspaceBaseURL}</span>
              }
              value={value.toLocaleLowerCase().trim().replace(/ /g, "-")}
              onChange={(e) => {
                if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                else setInvalidSlug(true);
                onChange(e.target.value.toLowerCase());
              }}
              ref={ref}
              placeholder="workspace-name"
              error={
                slugError
                  ? "This URL is taken. Try something else."
                  : invalidSlug
                    ? "URLs can contain only ( - ), ( _ ) and alphanumeric characters."
                    : errors.slug?.message
              }
            />
          )}
        />
        <div className="flex flex-col gap-2">
          <span id={organizationSizeLabelId} className="text-body-xs-medium text-primary">
            {t("workspace_creation.form.organization_size.label")}
            <span className="ml-0.5 text-danger-primary" aria-hidden="true">
              *
            </span>
          </span>
          <div className="w-full">
            <Controller
              name="organization_size"
              control={control}
              rules={{ required: "This is a required field." }}
              render={({ field: { value, onChange } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger
                    variant="secondary"
                    size="lg"
                    placeholder={t("workspace_creation.form.organization_size.placeholder")}
                    aria-required="true"
                    aria-labelledby={organizationSizeLabelId}
                    aria-describedby={errors.organization_size ? organizationSizeErrorId : undefined}
                    aria-invalid={Boolean(errors.organization_size)}
                  />
                  <SelectContent>
                    <SelectList>
                      {ORGANIZATION_SIZE.map((item) => (
                        <SelectItem key={item} value={item} label={item} size="lg" />
                      ))}
                    </SelectList>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.organization_size && (
              <span id={organizationSizeErrorId} className="text-body-xs-regular text-danger-primary">
                {errors.organization_size.message}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex max-w-4xl items-center gap-4 py-1">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          onClick={handleSubmit(handleCreateWorkspace)}
          disabled={!isValid}
          loading={isSubmitting}
          label={isSubmitting ? "Creating workspace" : "Create workspace"}
        />
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          nativeButton={false}
          render={<Link href="/workspace" />}
          label="Go back"
        />
      </div>
    </div>
  );
}
