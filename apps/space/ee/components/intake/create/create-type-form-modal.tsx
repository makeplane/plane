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

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { FormProvider, useForm } from "react-hook-form";
import type { EditorRefApi } from "@plane/editor";
import { IntakePublishForm } from "@plane/propel/domain/intake-form";
import { PlaneLogo } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIntakeFormSettingsResponse, TIntakeFormSubmitPayload } from "@plane/types";
import { cn } from "@plane/utils";
import CoverImage1 from "@/app/assets/cover-images/image_1.jpg?url";
import GridBgDark from "@/app/assets/images/grid-bg-dark.svg?url";
import GridBgLight from "@/app/assets/images/grid-bg-light.svg?url";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useIntake } from "@/plane-web/hooks/store/use-intake";
import IntakeInfo from "../info";
import FormSuccess from "./success";

type TProps = {
  formSettings: TIntakeFormSettingsResponse;
  anchor: string;
};

type TFormSubmitData = {
  username: string;
  email: string;
  name: string;
  description_html: string;
  attachment_ids: string[];
};

function CreateTypeFormModal({ formSettings, anchor }: TProps) {
  // state
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  // hooks
  const { submitTypeForm, settings, uploadWorkItemAttachment } = useIntake();
  const { resolvedTheme } = useTheme();
  const { uploadIssueAsset } = useIssueDetails();
  // form info
  const methods = useForm({
    defaultValues: { email: "", username: "", description_html: "", name: "" },
    reValidateMode: "onChange",
  });

  // derived
  const gridBgImage = resolvedTheme === "dark" ? GridBgDark : GridBgLight;
  const projectDetails = formSettings.project_details;

  // Transform form_fields to the format expected by IntakePublishForm
  const formProperties = (formSettings.form_fields || []).map((field) => ({
    property: {
      ...field,
    },
    options: field.options || [],
  }));

  const handleFileUpload = async (files: File[]) => {
    const uploadPromises = files.map((file) => uploadWorkItemAttachment(file, anchor));
    const results = await Promise.all(uploadPromises).catch((error) => {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to upload files. Please try again.",
      });
      return [];
    });
    return results.map((result) => result.asset_id);
  };

  const handleFormSubmit = async (data: Record<string, unknown>): Promise<void> => {
    const formData = data as TFormSubmitData;
    try {
      if (!descriptionEditorRef.current?.isEditorReadyToDiscard()) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Editor is still processing changes. Please wait before proceeding.",
        });
        return;
      }

      setIsSubmitting(true);

      // Transform property fields to values object
      const values: Record<string, string | string[] | boolean> = {};
      Object.keys(formData).forEach((key) => {
        if (key.startsWith("property_")) {
          const propertyId = key.replace("property_", "");
          const value = formData[key as keyof TFormSubmitData];
          if (value !== null && value !== undefined) {
            if (typeof value === "boolean") {
              values[propertyId] = value;
            } else {
              values[propertyId] = Array.isArray(value) ? value.map(String) : String(value);
            }
          }
        }
      });

      const payload: TIntakeFormSubmitPayload = {
        username: formData.username || "",
        email: formData.email || "",
        name: formData.name || "",
        description_html: formData.description_html || "<p></p>",
        values,
        attachment_ids: formData.attachment_ids || [],
      };

      await submitTypeForm(anchor, payload);
      setSuccess(true);
      methods.reset();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to submit form. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-1">
      {!success && <img src={gridBgImage} alt="Grid Background" className="absolute top-0 left-0 w-full h-full" />}

      <div className="flex justify-between pt-6 px-page-x z-10">
        <div className="flex gap-2 items-center">
          <PlaneLogo className="h-6 w-auto text-primary" />
          <div className="text-20 text-primary font-semibold">Plane</div>
          <div className="text-20 text-tertiary font-semibold">Intake</div>
        </div>
        <IntakeInfo />
      </div>

      <div className="flex justify-center w-full h-full items-center overflow-y-auto py-8">
        {!success ? (
          <div
            className={cn(
              "p-4 rounded-md w-[375px] md:w-[575px] shadow-raised-100 border-[1px] z-[5] border-subtle-1 bg-layer-1 my-auto",
              {
                "bg-surface-1 border-subtle shadow-raised-100": resolvedTheme === "light",
              }
            )}
          >
            <FormProvider {...methods}>
              <IntakePublishForm
                projectName={projectDetails?.name || ""}
                projectLogo={projectDetails?.logo_props}
                projectCoverImage={projectDetails?.cover_image_url}
                // CoverImage1 is the default cover image in web/helpers/cover-image.helper.ts
                projectCoverImageFallback={CoverImage1}
                formTitle={formSettings.name}
                properties={formProperties}
                isSubmitting={isSubmitting}
                onSubmit={handleFormSubmit}
                editorComponent={RichTextEditor}
                editorProps={{
                  editable: true,
                  id: "type-form-editor",
                  initialValue: "<p></p>",
                  ref: descriptionEditorRef,
                  dragDropEnabled: false,
                  placeholder: () => "",
                  containerClassName:
                    "px-3 text-14 bg-layer-2 placeholder-tertiary focus:outline-none border-[0.5px] focus:border-blue-400 border-subtle-1",
                  uploadFile: async (blockId: string, file: File) => {
                    const { asset_id } = await uploadIssueAsset(file, anchor);
                    return asset_id;
                  },
                  anchor,
                  workspaceId: settings?.workspace ?? "",
                }}
                onFileUpload={async (files: File[]) => handleFileUpload(files)}
              />
            </FormProvider>
          </div>
        ) : (
          <FormSuccess onReset={() => setSuccess(false)} />
        )}
      </div>
    </div>
  );
}

export default CreateTypeFormModal;
