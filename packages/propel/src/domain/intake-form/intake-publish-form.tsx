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

import React, { useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { EIssuePropertyType } from "@plane/types";
import type { TIntakeFormProperty, TIntakePublishFormProps, TIssueProperty } from "@plane/types";
import { getFileURL } from "@plane/utils";
import { Button } from "../../button";
import { Input } from "../../input";
import { ProjectLogo } from "../../project";
import { cn } from "../../utils";
import { BooleanInput, DateSelect, NumberInput, OptionSelect, TextInput, UrlInput } from "../custom-property-inputs";
import { AttachmentPreviewList, extractFileExtension } from "../work-items";
import type { TAttachmentPreviewItem } from "../work-items";

export function IntakePublishForm({
  isPreview = false,
  projectName,
  projectLogo,
  projectCoverImage,
  formTitle,
  formDescription,
  showDescription = true,
  isTitleRequired = true,
  isDescriptionRequired = true,
  properties,
  isSubmitting = false,
  onSubmit,
  editorComponent: EditorComponent,
  editorProps,
  onFileUpload,
  className = "",
  projectCoverImageFallback,
}: TIntakePublishFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<{
    username: string;
    email: string;
    name: string;
    description_html: string;
    attachment_ids: string[];
  }>({
    defaultValues: {
      username: "",
      email: "",
      name: "",
      description_html: "",
      attachment_ids: [],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const [attachmentPreviews, setAttachmentPreviews] = useState<TAttachmentPreviewItem[]>([]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (isPreview || !onSubmit) return;
    await onSubmit(data);
  };

  const handleFileSelection = async (files: File[]) => {
    if (!files.length) return;

    const newItems: TAttachmentPreviewItem[] = files.map((file) => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      extension: extractFileExtension(file.name),
      status: onFileUpload ? "uploading" : "uploaded",
    }));

    setAttachmentPreviews((prev) => [...prev, ...newItems]);

    if (!onFileUpload) return;

    const newItemIds = new Set(newItems.map((item) => item.id));

    try {
      const assetIds = await onFileUpload(files);

      const assetUpdates = new Map<string, string>();
      if (Array.isArray(assetIds)) {
        newItems.forEach((item, index) => {
          const assetId = assetIds[index];
          if (typeof assetId === "string" && assetId.length > 0) {
            assetUpdates.set(item.id, assetId);
          }
        });
      }

      if (!assetUpdates.size) {
        setAttachmentPreviews((prev) => prev.filter((item) => !newItemIds.has(item.id)));
        return;
      }

      const uploadedAssetIds = Array.from(assetUpdates.values());
      const currentAttachmentIds = getValues("attachment_ids") ?? [];
      const merged = Array.from(new Set([...currentAttachmentIds, ...uploadedAssetIds]));
      setValue("attachment_ids", merged, { shouldDirty: true, shouldValidate: true });

      setAttachmentPreviews((prev) =>
        prev
          .map((item) => {
            if (assetUpdates.has(item.id)) {
              return {
                ...item,
                assetId: assetUpdates.get(item.id),
                status: "uploaded" as const,
              };
            }
            if (newItemIds.has(item.id)) {
              return null;
            }
            return item;
          })
          .filter((item): item is TAttachmentPreviewItem => item !== null)
      );
    } catch (_error) {
      setAttachmentPreviews((prev) => prev.filter((item) => !newItemIds.has(item.id)));
    }
  };

  const renderPropertyInput = (propertyConfig: TIntakeFormProperty) => {
    const { property, options = [] } = propertyConfig;

    const propertyType = property.property_type;

    switch (propertyType) {
      case EIssuePropertyType.TEXT:
        return <TextInput property={property as TIssueProperty<EIssuePropertyType.TEXT>} isPreview={isPreview} />;

      case EIssuePropertyType.DECIMAL:
        return <NumberInput property={property as TIssueProperty<EIssuePropertyType.DECIMAL>} isPreview={isPreview} />;

      case EIssuePropertyType.OPTION:
        return (
          <OptionSelect
            property={property as TIssueProperty<EIssuePropertyType.OPTION>}
            options={options}
            isPreview={isPreview}
          />
        );

      case EIssuePropertyType.BOOLEAN:
        return <BooleanInput property={property as TIssueProperty<EIssuePropertyType.BOOLEAN>} isPreview={isPreview} />;

      case EIssuePropertyType.DATETIME:
        return <DateSelect property={property as TIssueProperty<EIssuePropertyType.DATETIME>} isPreview={isPreview} />;

      case EIssuePropertyType.URL:
        return <UrlInput property={property as TIssueProperty<EIssuePropertyType.URL>} isPreview={isPreview} />;

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {/* Project Header */}
          <div className="relative h-[133px] w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
            <img
              src={getFileURL(projectCoverImage ?? projectCoverImageFallback)}
              alt="Project cover image"
              className="h-[133px] w-full rounded-md object-cover"
            />
            <div className="z-5 absolute bottom-2 flex w-full items-end justify-between gap-3 px-4">
              <div className="flex flex-grow gap-3 truncate items-center">
                {projectLogo && <ProjectLogo logo={projectLogo} className="my-auto text-[24px]" />}
                <div className="flex flex-col gap-1 truncate text-on-color items-center">
                  <span className="truncate text-16 font-semibold">{projectName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Title */}
          <div className="mb-6">
            <h3 className="text-18 font-medium text-secondary">{formTitle || "Create a work item"}</h3>
            {formDescription && (
              <div className="text-13 text-tertiary flex gap-2 mt-1">
                <span>{formDescription}</span>
              </div>
            )}
          </div>

          {/* Name Field */}
          <div className="w-full">
            <div className="text-13 text-tertiary mb-1 font-medium">
              Name
              <span className="ml-0.5 text-danger-primary">*</span>
            </div>
            <Controller
              control={control}
              name="username"
              rules={{
                required: "Name is required",
                maxLength: {
                  value: 255,
                  message: "Name should be less than 255 characters",
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
                  disabled={isPreview}
                  className={cn("w-full focus:border-blue-400 text-14 border-subtle-1", {
                    "cursor-not-allowed opacity-60": isPreview,
                  })}
                />
              )}
            />
            {errors.username && (
              <span className="text-11 text-danger-primary">{errors.username.message as string}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="w-full">
            <div className="text-13 text-tertiary mb-1 font-medium">
              Email
              <span className="ml-0.5 text-danger-primary">*</span>
            </div>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
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
                  disabled={isPreview}
                  className={cn("w-full focus:border-blue-400 text-14 border-subtle-1", {
                    "cursor-not-allowed opacity-60": isPreview,
                  })}
                />
              )}
            />
            {errors.email && <span className="text-11 text-danger-primary">{errors.email.message as string}</span>}
          </div>

          {/* Title Field */}
          <div className="w-full">
            <div className="text-13 text-tertiary mb-1 font-medium">
              Title
              {isTitleRequired && <span className="ml-0.5 text-danger-primary">*</span>}
            </div>
            <Controller
              control={control}
              name="name"
              rules={{
                required: isTitleRequired ? "Title is required" : false,
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
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
                  disabled={isPreview}
                  className={cn("w-full focus:border-blue-400 text-14 border-subtle-1", {
                    "cursor-not-allowed opacity-60": isPreview,
                  })}
                />
              )}
            />
            {errors.name && <span className="text-11 text-danger-primary">{errors.name.message as string}</span>}
          </div>

          {/* Description Field */}
          {showDescription && (
            <div className="w-full">
              <div className="text-13 text-tertiary mb-1 font-medium">
                Description
                {isDescriptionRequired && <span className="ml-0.5 text-danger-primary">*</span>}
              </div>
              {EditorComponent ? (
                <Controller
                  name="description_html"
                  control={control}
                  rules={{
                    validate: isDescriptionRequired
                      ? (value: string) =>
                          (value && value !== "<p></p>" && value.trim() !== "") || "Description is required"
                      : undefined,
                  }}
                  render={({ field: { onChange } }) => (
                    <EditorComponent
                      onChange={(_description: object, description_html: string) => onChange(description_html)}
                      {...editorProps}
                    />
                  )}
                />
              ) : (
                <Controller
                  name="description_html"
                  control={control}
                  rules={{
                    required: isDescriptionRequired ? "Description is required" : false,
                  }}
                  render={({ field: { value, onChange } }) => (
                    <textarea
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="Add as much detail as you'd like to help the team identify your exact situation and needs."
                      disabled={isPreview}
                      className={cn(
                        "w-full px-3 py-2 rounded-md border border-subtle-1 bg-surface-1 text-13 focus:outline-none min-h-[120px] resize-none",
                        {
                          "cursor-not-allowed opacity-60": isPreview,
                        }
                      )}
                    />
                  )}
                />
              )}
              {errors.description_html && (
                <span className="text-11 text-danger-primary">{errors.description_html.message as string}</span>
              )}
            </div>
          )}

          {/* Dynamic Property Fields */}
          {properties.map((propertyConfig) => (
            <React.Fragment key={propertyConfig.property.id}>{renderPropertyInput(propertyConfig)}</React.Fragment>
          ))}

          {/* Attachments Field */}
          <div className="w-full">
            <div className="text-13 text-tertiary mb-1 font-medium">Attachments</div>
            <div
              className={cn(
                "rounded-md border-2 border-dashed border-subtle-1 p-4 text-center cursor-pointer hover:border-strong-1 transition-colors",
                {
                  "cursor-not-allowed opacity-60": isPreview,
                }
              )}
              onClick={() => {
                if (!isPreview) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                disabled={isPreview}
                onChange={async (e) => {
                  if (!e.target.files || isPreview) return;
                  const files = Array.from(e.target.files);
                  await handleFileSelection(files);
                  e.target.value = "";
                }}
              />
              <p className="text-13 text-tertiary">Click to upload or drag and drop files</p>
            </div>
            <AttachmentPreviewList items={attachmentPreviews} />
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={isSubmitting}
            disabled={isPreview}
            className={cn("mx-auto ml-0", {
              "cursor-not-allowed opacity-60": isPreview,
            })}
          >
            {isSubmitting ? "Creating" : "Create work item"}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}
