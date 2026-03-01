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

import { useState } from "react";
import { observer } from "mobx-react";
import type { Accept } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { ImageUp, Upload } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { checkURLValidity, cn, getAssetIdFromUrl, getFileURL } from "@plane/utils";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type Props = {
  onImageUpload: (url: string) => void;
  initialValue: string | null;
  hasError?: boolean;
};

const ACCEPTED_FILE_TYPES: Accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] };

export const TemplateCoverImageUpload = observer(function TemplateCoverImageUpload(props: Props) {
  const { onImageUpload, initialValue, hasError } = props;
  // states
  const [coverImage, setCoverImage] = useState<string | null>(initialValue);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { maxFileSize } = useFileSize();
  // derived values
  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setNewImage(acceptedFiles[0]);
      setIsOpen(true);
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: maxFileSize,
    multiple: false,
  });

  const handleClose = () => {
    setNewImage(null);
    setIsUploading(false);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!newImage || !workspaceSlug || !workspaceId) return;
    setIsUploading(true);

    try {
      const assetUrl = await fileService
        .uploadWorkspaceAsset(
          workspaceSlug.toString(),
          { entity_identifier: workspaceId.toString(), entity_type: EFileAssetType.TEMPLATE_ATTACHMENT },
          newImage
        )
        .then((res) => res.asset_url);

      onImageUpload(assetUrl);
      setCoverImage(assetUrl);
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Upload Failed",
        message: error?.toString() ?? "Something went wrong. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!coverImage || !workspaceSlug || !workspaceId) return;
    setIsRemoving(true);
    try {
      if (checkURLValidity(coverImage)) {
        await fileService.deleteOldWorkspaceAssetV2(workspaceSlug, coverImage);
      } else {
        const assetId = getAssetIdFromUrl(coverImage);
        await fileService.deleteWorkspaceAsset(workspaceSlug, assetId);
      }
      setCoverImage(null);
      onImageUpload("");
    } catch (error) {
      console.log("Error removing image:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "group border border-dashed border-subtle bg-layer-1 hover:bg-layer-1-hover rounded-lg relative w-full",
          coverImage ? "h-40" : "h-20",
          {
            "border-danger-subtle": hasError,
          }
        )}
        {...getRootProps()}
      >
        {coverImage ? (
          <>
            <img
              src={getFileURL(coverImage)}
              className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
              alt="Template cover image"
            />
            <div className="absolute bottom-2 right-2">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageRemove();
                }}
                loading={isRemoving}
              >
                {isRemoving ? t("removing") : t("remove")}
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute left-0 top-0 h-full w-full flex items-center justify-center gap-1.5 p-4">
            <ImageUp className="size-5 text-placeholder" />
            <p className="text-body-xs-medium text-tertiary group-hover:text-secondary">
              {t("templates.settings.form.publish.cover_image.upload_placeholder")}
            </p>
          </div>
        )}
        <input {...getInputProps()} />
      </div>

      <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
        <div className="px-4 py-4">
          <h3 className="text-h6-medium text-primary">
            {t("templates.settings.form.publish.cover_image.upload_title")}
          </h3>
          <div className="mt-4">
            <div
              className={cn("group relative w-full min-w-80 flex items-center cursor-pointer p-2", {
                "border border-dashed border-subtle bg-layer-1 hover:bg-layer-1-hover rounded-lg": !newImage,
                "border-danger-subtle": hasError,
              })}
            >
              {newImage ? (
                <div className="relative h-40 w-full">
                  <img
                    src={URL.createObjectURL(newImage)}
                    alt="Preview"
                    className="h-full w-full object-cover rounded-lg"
                  />
                  <button
                    className="absolute -top-1.5 -right-1.5 border border-subtle bg-layer-1 opacity-80 hover:opacity-100 transition-opacity duration-200 rounded-full p-[1px] shadow-sm"
                    onClick={() => setNewImage(null)}
                  >
                    <CloseIcon className="flex-shrink-0 size-3 text-primary" />
                  </button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 text-center" {...getRootProps()}>
                  <Upload className="size-5 text-placeholder" />
                  <p className="text-body-xs-medium text-tertiary group-hover:text-secondary">
                    {isDragActive
                      ? t("templates.settings.form.publish.cover_image.drop_here")
                      : t("templates.settings.form.publish.cover_image.click_to_upload")}
                  </p>
                </div>
              )}
            </div>
            {fileRejections.length > 0 && (
              <p className="text-danger text-body-xs-regular mt-2">
                {t("templates.settings.form.publish.cover_image.invalid_file_or_exceeds_size_limit", {
                  size: maxFileSize,
                })}
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!newImage} loading={isUploading}>
                {isUploading
                  ? t("templates.settings.form.publish.cover_image.uploading")
                  : t("templates.settings.form.publish.cover_image.upload_and_save")}
              </Button>
            </div>
          </div>
        </div>
      </ModalCore>
    </div>
  );
});
