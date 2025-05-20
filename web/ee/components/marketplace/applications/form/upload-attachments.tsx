"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Transition, Dialog } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { EFileAssetType } from "@plane/types/src/enums";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { getAssetIdFromUrl, getFileURL } from "@/helpers/file.helper";
import { checkURLValidity } from "@/helpers/string.helper";
// services
import { useWorkspace } from "@/hooks/store";
import { FileService } from "@/services/file.service";

const fileService = new FileService();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type Props = {
  onFilesFinalise: (urls: string[]) => void;
  initialValue: string[] | null;
  entityType: EFileAssetType;
};

export const UploadAppAttachments: React.FC<Props> = observer((props) => {
  const { onFilesFinalise, initialValue, entityType } = props;
  // states
  const [allImages, setAllImages] = useState<string[]>(initialValue ?? []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const onDrop = (acceptedFiles: File[]) => {
    setNewImages(acceptedFiles);
    setIsOpen(true);
  };

  const { currentWorkspace } = useWorkspace();
  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const { t } = useTranslation();

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
    setIsRemoving(true);
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
      setIsRemoving(false);
    }
  };

  const handleImagePreviewRemove = (file: File) => {
    setNewImages(newImages.filter((image) => image !== file));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-dashed border-custom-border-200 p-10 flex flex-col space-y-4">
        <div className="text-lg flex items-center justify-center cursor-pointer" {...getRootProps()}>
          <Upload className="w-4 h-4 mr-2" />
          <div className="text-lg font-medium text-custom-text-200">{t("workspace_settings.settings.applications.upload_attachments")}</div>
          <input {...getInputProps()} />
        </div>
        <div className="flex items-center gap-2">
          {allImages.map((image) => ImagePreview(image, true, () => handleImageRemove(image)))}
        </div>
      </div>
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:max-w-xl">
                <Dialog.Title as="h3" className="text-lg font-medium text-custom-text-100">
                  {t("workspace_settings.settings.applications.uploading_images", { count: newImages.length })}
                </Dialog.Title>
                <div className="mt-4">
                  <div className="relative w-80 border-2 border-dashed border-custom-border-200 rounded-lg flex items-center cursor-pointer p-2 flex-wrap gap-2">
                    {newImages.length > 0 ? (
                      <>{newImages.map((image) => ImagePreview(image, false, () => handleImagePreviewRemove(image)))}</>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 text-center">
                        <Upload className="mx-auto h-16 w-16 text-custom-text-200" />
                        <p className="text-sm text-custom-text-200">
                          {isDragActive ? t("workspace_settings.settings.applications.drop_images_here") : t("workspace_settings.settings.applications.click_to_upload_images")}
                        </p>
                      </div>
                    )}
                  </div>
                  {fileRejections.length > 0 && (
                    <p className="text-red-500 text-sm mt-2">{t("workspace_settings.settings.applications.invalid_file_or_exceeds_size_limit", { size: MAX_FILE_SIZE })}</p>
                  )}
                </div>
                <div className="mt-6 flex justify-between">
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
                      {isUploading ? t("workspace_settings.settings.applications.uploading") : t("workspace_settings.settings.applications.upload_and_save")}
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

function ImagePreview(image: string | File, isURL: boolean, onRemove: () => void): React.ReactNode {
  console.log(image, isURL, isURL ? getFileURL(image as string) : URL.createObjectURL(image as File));
  return (
    <div className="relative h-20 w-20 border border-custom-border-200 rounded-lg flex items-center justify-center cursor-pointer">
      <div className="absolute top-0 right-0">
        <X className="w-4 h-4 text-custom-text-200" onClick={onRemove} />
      </div>
      <img
        loading="lazy"
        src={isURL ? getFileURL(image as string) : URL.createObjectURL(image as File)}
        alt="Uploaded preview"
        className="h-full w-full object-cover rounded-md"
      />
    </div>
  );
}

export default UploadAppAttachments;
