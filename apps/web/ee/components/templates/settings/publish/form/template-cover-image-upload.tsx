import React, { useState } from "react";
import { observer } from "mobx-react";
import { Accept, useDropzone } from "react-dropzone";
import { ImageUp, Upload, X } from "lucide-react";
import { Transition, Dialog } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
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

export const TemplateCoverImageUpload: React.FC<Props> = observer((props) => {
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
          "group border border-dashed border-custom-border-200 bg-custom-background-90 hover:bg-custom-background-80/70 rounded-lg relative w-full",
          coverImage ? "h-40" : "h-20",
          {
            "border-red-500": hasError,
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
                variant="neutral-primary"
                size="sm"
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
            <ImageUp className="size-5 text-custom-text-400" />
            <p className="text-sm font-medium text-custom-text-300 group-hover:text-custom-text-200">
              {t("templates.settings.form.publish.cover_image.upload_placeholder")}
            </p>
          </div>
        )}
        <input {...getInputProps()} />
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
            <div className="flex min-h-full items-center justify-center px-4 text-center">
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-4 py-4 text-left shadow-custom-shadow-md transition-all sm:max-w-xl">
                <Dialog.Title as="h3" className="text-lg font-medium text-custom-text-100">
                  {t("templates.settings.form.publish.cover_image.upload_title")}
                </Dialog.Title>
                <div className="mt-4">
                  <div
                    className={cn("group relative w-full min-w-80 flex items-center cursor-pointer p-2", {
                      "border border-dashed border-custom-border-200 bg-custom-background-90 hover:bg-custom-background-80/70 rounded-lg":
                        !newImage,
                      "border-red-500": hasError,
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
                          className="absolute -top-1.5 -right-1.5 border-[0.5px] border-custom-border-200 bg-custom-background-90 opacity-80 hover:opacity-100 transition-opacity duration-200 rounded-full p-[1px] shadow-sm"
                          onClick={() => setNewImage(null)}
                        >
                          <X className="flex-shrink-0 size-3 text-custom-text-100" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex w-full items-center justify-center gap-2 text-center" {...getRootProps()}>
                        <Upload className="size-5 text-custom-text-400" />
                        <p className="text-sm font-medium text-custom-text-300 group-hover:text-custom-text-200">
                          {isDragActive
                            ? t("templates.settings.form.publish.cover_image.drop_here")
                            : t("templates.settings.form.publish.cover_image.click_to_upload")}
                        </p>
                      </div>
                    )}
                  </div>
                  {fileRejections.length > 0 && (
                    <p className="text-red-500 text-sm mt-2">
                      {t("templates.settings.form.publish.cover_image.invalid_file_or_exceeds_size_limit", {
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
                      disabled={!newImage}
                      loading={isUploading}
                    >
                      {isUploading
                        ? t("templates.settings.form.publish.cover_image.uploading")
                        : t("templates.settings.form.publish.cover_image.upload_and_save")}
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
