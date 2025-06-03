"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Accept, useDropzone } from "react-dropzone";
import { ImageUp, Upload, X, Loader as Spinner, Plus } from "lucide-react";
import { Transition, Dialog } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType } from "@plane/types/src/enums";
import { Button, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { getAssetIdFromUrl, getFileURL } from "@/helpers/file.helper";
import { checkURLValidity } from "@/helpers/string.helper";
// store hooks
import { useWorkspace } from "@/hooks/store";
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

export const UploadAppAttachments: React.FC<Props> = observer((props) => {
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
          className={cn("border-[0.5px] border-custom-border-200 rounded-md flex items-center gap-2 p-4", {
            "border-red-500": hasError,
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
          <div className={cn(getButtonStyling("neutral-primary", "sm"), "mx-2 p-2")} {...getRootProps()}>
            <Plus className="size-4" />
            <input {...getInputProps()} />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "group border border-dashed border-custom-border-200 bg-custom-background-90 hover:bg-custom-background-80/70 rounded-md flex items-center justify-center gap-1.5 p-4 cursor-pointer",
            {
              "border-red-500": hasError,
            }
          )}
          {...getRootProps()}
        >
          <ImageUp className="size-7 text-custom-text-400" />
          <div className="text-sm font-medium text-custom-text-300 group-hover:text-custom-text-200">
            Drag and drop to upload external files
          </div>
          <input {...getInputProps()} />
        </div>
      )}
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-30" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 text-center">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-4 py-4 text-left shadow-custom-shadow-md transition-all sm:max-w-xl">
                <Dialog.Title as="h3" className="text-lg font-medium text-custom-text-100">
                  {t("workspace_settings.settings.applications.uploading_images", { count: newImages.length })}
                </Dialog.Title>
                <div className="mt-4">
                  <div
                    className={cn(
                      "group relative w-full min-w-80 flex items-center cursor-pointer p-2 flex-wrap gap-2",
                      {
                        "border border-dashed border-custom-border-200 rounded-lg": !isAnyNewImageAvailable,
                        "border-red-500": hasError,
                      }
                    )}
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
                        <Upload className="size-5 text-custom-text-400" />
                        <p className="text-sm font-medium text-custom-text-300 group-hover:text-custom-text-200">
                          {isDragActive
                            ? t("workspace_settings.settings.applications.drop_images_here")
                            : t("workspace_settings.settings.applications.click_to_upload_images")}
                        </p>
                      </div>
                    )}
                  </div>
                  {fileRejections.length > 0 && (
                    <p className="text-red-500 text-sm mt-2">
                      {t("workspace_settings.settings.applications.invalid_file_or_exceeds_size_limit", {
                        size: maxFileSize,
                      })}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <div className="flex gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!newImages.length}
                      loading={isUploading}
                    >
                      {isUploading
                        ? t("workspace_settings.settings.applications.uploading")
                        : t("workspace_settings.settings.applications.upload_and_save")}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
});

type TImagePreviewProps = {
  image: string | File;
  isURL: boolean;
  isLoading?: boolean;
  onRemove: () => void;
};

const ImagePreview: React.FC<TImagePreviewProps> = (props) => {
  const { image, isURL, onRemove, isLoading } = props;
  // derived values
  const imageSrc = isURL ? getFileURL(image as string) : URL.createObjectURL(image as File);

  return (
    <div
      key={imageSrc}
      className="relative h-20 w-20 border border-custom-border-200 rounded-lg flex items-center justify-center cursor-pointer"
    >
      <div className="absolute -top-1.5 -right-1.5 border-[0.5px] border-custom-border-200 bg-custom-background-90 opacity-80 hover:opacity-100 transition-opacity duration-200 rounded-full p-[1px] shadow-sm">
        {isLoading ? (
          <Spinner className="flex-shrink-0 animate-spin size-3 text-custom-text-100" />
        ) : (
          <X className="flex-shrink-0 size-3 text-custom-text-100" onClick={onRemove} />
        )}
      </div>
      <img loading="lazy" src={imageSrc} alt="Uploaded preview" className="h-full w-full object-cover rounded-md" />
    </div>
  );
};

export default UploadAppAttachments;
