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
import { ImageUp, Loader as Spinner, Upload } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon, PlusIcon } from "@plane/propel/icons";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EFileAssetType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, checkURLValidity, getAssetIdFromUrl, getFileURL } from "@plane/utils";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type Props = {
  onFilesFinalise: (urls: string[]) => void;
  initialValue: string[] | null;
  entityType: EFileAssetType;
  hasError?: boolean;
};

const ACCEPTED_FILE_TYPES: Accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] };

export const UploadAppAttachments = observer(function UploadAppAttachments(props: Props) {
  const { onFilesFinalise, initialValue, entityType, hasError } = props;
  // states
  const [allImages, setAllImages] = useState<string[]>(initialValue ?? []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [removingImageUrl, setRemovingImageUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { maxFileSize } = useFileSize();
  // derived values
  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;
  const isAnyImageAvailable = allImages.length > 0;
  const isAnyNewImageAvailable = newImages.length > 0;

  const onDrop = (acceptedFiles: File[]) => {
    setNewImages(acceptedFiles);
    setIsOpen(true);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: maxFileSize,
    multiple: true,
  });

  const handleClose = () => {
    setNewImages([]);
    setIsUploading(false);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!newImages.length || !workspaceSlug || !workspaceId) return;
    setIsUploading(true);

    try {
      const assetUrls = await Promise.all(
        newImages.map((image) =>
          fileService
            .uploadWorkspaceAsset(
              workspaceSlug.toString(),
              { entity_identifier: workspaceId.toString(), entity_type: entityType },
              image
            )
            .then((res) => res.asset_url)
        )
      );
      onFilesFinalise([...allImages, ...assetUrls]);
      setAllImages([...allImages, ...assetUrls]);
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

  const handleImageRemove = async (fileUrl: string) => {
    if (!fileUrl || !workspaceSlug || !workspaceId) return;
    setRemovingImageUrl(fileUrl);
    try {
      if (checkURLValidity(fileUrl)) {
        await fileService.deleteOldWorkspaceAssetV2(workspaceSlug, fileUrl);
      } else {
        const assetId = getAssetIdFromUrl(fileUrl);
        await fileService.deleteWorkspaceAsset(workspaceSlug, assetId);
      }
      setAllImages(allImages.filter((image) => image !== fileUrl));
      onFilesFinalise(allImages.filter((image) => image !== fileUrl));
    } catch (error) {
      console.log("Error removing image:", error);
    } finally {
      setRemovingImageUrl(null);
    }
  };

  const handleImagePreviewRemove = (file: File) => {
    setNewImages(newImages.filter((image) => image !== file));
  };

  return (
    <div className="flex flex-col gap-4">
      {isAnyImageAvailable ? (
        <div
          className={cn("border border-subtle-1 rounded-md flex items-center gap-2 p-4", {
            "border-danger-subtle": hasError,
          })}
        >
          {allImages.map((image) => (
            <ImagePreview
              key={image}
              image={image}
              isURL
              onRemove={() => handleImageRemove(image)}
              isLoading={removingImageUrl === image}
            />
          ))}
          <div className={cn(getButtonStyling("secondary", "base"), "mx-2 p-2")} {...getRootProps()}>
            <PlusIcon className="size-4" />
            <input {...getInputProps()} />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "group border border-dashed border-subtle-1  h-24 bg-surface-1 rounded-md flex items-center justify-center gap-1.5 p-4 cursor-pointer",
            {
              "border-danger-subtle": hasError,
            }
          )}
          {...getRootProps()}
        >
          <ImageUp className="size-5 text-accent-primary" />
          <div className="text-body-xs-medium group-hover:text-accent-primary text-accent-primary">
            Drag and drop to upload external files
          </div>
          <input {...getInputProps()} />
        </div>
      )}
      <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
        <div className="px-4 py-4">
          <h3 className="text-h6-medium text-primary">
            {t("workspace_settings.settings.applications.uploading_images", { count: newImages.length })}
          </h3>
          <div className="mt-4">
            <div
              className={cn("group relative w-full min-w-80 flex items-center cursor-pointer p-2 flex-wrap gap-2", {
                "border border-dashed border-subtle-1 rounded-lg": !isAnyNewImageAvailable,
                "border-danger-subtle": hasError,
              })}
            >
              {isAnyNewImageAvailable ? (
                <>
                  {newImages.map((image) => (
                    <ImagePreview
                      key={image.name}
                      image={image}
                      isURL={false}
                      onRemove={() => handleImagePreviewRemove(image)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 text-center" {...getRootProps()}>
                  <Upload className="size-5 text-tertiary" />
                  <p className="text-body-xs-medium text-secondary group-hover:text-accent-primary">
                    {isDragActive
                      ? t("workspace_settings.settings.applications.drop_images_here")
                      : t("workspace_settings.settings.applications.click_to_upload_images")}
                  </p>
                </div>
              )}
            </div>
            {fileRejections.length > 0 && (
              <p className="text-danger text-body-xs-regular mt-2">
                {t("workspace_settings.settings.applications.invalid_file_or_exceeds_size_limit", {
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
              <Button variant="primary" onClick={handleSubmit} disabled={!newImages.length} loading={isUploading}>
                {isUploading
                  ? t("workspace_settings.settings.applications.uploading")
                  : t("workspace_settings.settings.applications.upload_and_save")}
              </Button>
            </div>
          </div>
        </div>
      </ModalCore>
    </div>
  );
});

type TImagePreviewProps = {
  image: string | File;
  isURL: boolean;
  isLoading?: boolean;
  onRemove: () => void;
};

function ImagePreview(props: TImagePreviewProps) {
  const { image, isURL, onRemove, isLoading } = props;
  // derived values
  const imageSrc = isURL ? getFileURL(image as string) : URL.createObjectURL(image as File);

  return (
    <div
      key={imageSrc}
      className="relative h-20 w-20 border border-subtle-1 rounded-lg flex items-center justify-center cursor-pointer"
    >
      <div className="absolute -top-1.5 -right-1.5 border border-subtle-1 bg-layer-1 opacity-80 hover:opacity-100 transition-opacity duration-200 rounded-full p-[1px] shadow-sm">
        {isLoading ? (
          <Spinner className="flex-shrink-0 animate-spin size-3 text-primary" />
        ) : (
          <CloseIcon className="flex-shrink-0 size-3 text-primary" onClick={onRemove} />
        )}
      </div>
      <img loading="lazy" src={imageSrc} alt="Uploaded preview" className="h-full w-full object-cover rounded-md" />
    </div>
  );
}

export default UploadAppAttachments;
