/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane types
import { Controller, useFormContext } from "react-hook-form";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IProject } from "@plane/types";
// plane ui
import { Input } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import CoverImage1 from "@/app/assets/cover-images/image_1.jpg?url";
import { ProjectLogo } from "@/components/common/project-logo";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// local types
import type { TFormData } from "./create-issue-modal";

type TProps = {
  project: Partial<IProject>;
  isSubmitting: boolean;
  descriptionEditorRef: React.RefObject<EditorRefApi>;
  anchor: string;
  placeholder?: string | ((isFocused: boolean, isEmpty: boolean) => string);
};

const IssueForm = observer(function IssueForm(props: TProps) {
  const { project, isSubmitting, descriptionEditorRef, anchor } = props;
  // store hooks
  const { workspace: workspaceID, project_details } = usePublish(anchor);
  const { uploadIssueAsset } = useIssueDetails();
  const { t } = useTranslation();
  const {
    formState: { errors },
    control,
  } = useFormContext<TFormData>();

  return (
    <>
      <div className="space-y-5">
        <div className="relative h-[133px] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
          <img
            src={project_details?.cover_image_url ? getFileURL(project_details?.cover_image_url) : CoverImage1}
            alt="Project cover image"
            className="h-[133px] w-full rounded-md object-cover"
          />
          <div className="z-5 absolute bottom-2 flex w-full items-end justify-between gap-3 px-4">
            <div className="flex flex-grow gap-3 truncate items-center">
              {project.logo_props && <ProjectLogo logo={project.logo_props} className="my-auto text-[24px]" />}
              <div className="flex flex-col gap-1 truncate text-on-color items-center">
                <span className="truncate text-16 font-semibold">{project_details?.name}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-18 font-medium text-secondary">{t("intake_forms.create.title")}</h3>
          <div className="text-13 text-tertiary flex gap-2 mt-1">
            <span>{t("intake_forms.create.sub-title")}</span>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="text-13 text-tertiary mb-1 font-medium">
            {t("intake_forms.create.name")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </div>
          <Controller
            control={control}
            name="username"
            rules={{
              required: t("intake_forms.create.errors.name"),
              maxLength: {
                value: 255,
                message: t("intake_forms.create.errors.name_max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="username"
                name="username"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.username)}
                placeholder="Jason Ray"
                className="w-full focus:border-blue-400 text-14 border-subtle-1"
              />
            )}
          />
          <span className="text-11 text-danger-primary capitalize">{errors?.username?.message}</span>
        </div>
        <div className="md:col-span-3">
          <div className="text-13 text-tertiary mb-1 font-medium">
            {t("intake_forms.create.email")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t("intake_forms.create.errors.email"),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t("intake_forms.create.errors.email_invalid"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="email"
                name="email"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.email)}
                placeholder="jason.ray@company.com"
                className="w-full focus:border-blue-400 text-14 border-subtle-1"
              />
            )}
          />
          <span className="text-11 text-danger-primary capitalize">{errors?.email?.message}</span>
        </div>

        <div className="md:col-span-3">
          <div className="text-13 text-tertiary mb-1 font-medium">
            {t("intake_forms.create.about")}
            <span className="ml-0.5 text-danger-primary">*</span>
          </div>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("intake_forms.create.errors.title"),
              maxLength: {
                value: 255,
                message: t("intake_forms.create.errors.title_max_length"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.name)}
                placeholder="e.g., Improve vertical scroll, Approve laptop purchase"
                className="w-full focus:border-blue-400 text-14 border-subtle-1"
              />
            )}
          />
          <span className="text-11 text-danger-primary capitalize">{errors?.name?.message}</span>
        </div>
        <div className="md:col-span-3">
          <div className="text-13 text-tertiary mb-1 font-medium">{t("intake_forms.create.description")}</div>
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) => (
              <RichTextEditor
                editable
                id="inbox-modal-editor"
                initialValue="<p></p>"
                ref={descriptionEditorRef}
                dragDropEnabled={false}
                onChange={(_description: object, description_html: string) => onChange(description_html)}
                placeholder={() => ""}
                containerClassName="px-3 text-14 bg-layer-2 placeholder-tertiary focus:outline-none border-[0.5px] focus:border-blue-400 border-subtle-1"
                uploadFile={async (blockId, file) => {
                  const { asset_id } = await uploadIssueAsset(file, anchor);
                  return asset_id;
                }}
                anchor={anchor}
                workspaceId={workspaceID?.toString() ?? ""}
              />
            )}
          />
        </div>

        <Button variant="primary" type="submit" loading={isSubmitting} className="mx-auto ml-0">
          {isSubmitting ? t("intake_forms.create.loading") : t("intake_forms.create.create_work_item")}
        </Button>
      </div>
    </>
  );
});

export default IssueForm;
