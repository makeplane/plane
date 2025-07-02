"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { UserCircle2 } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { EFileAssetType } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { checkURLValidity, getAssetIdFromUrl, getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  initialValue: string | null;
  handleRemove: () => Promise<void>;
  entityType: EFileAssetType;
};

export const AppImageUploadModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, onSuccess, initialValue, handleRemove, entityType } = props;
  // states
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const onDrop = (acceptedFiles: File[]) => setImage(acceptedFiles[0]);

  const { currentWorkspace } = useWorkspace();
  const workspaceSlug = currentWorkspace?.slug;
  const workspaceId = currentWorkspace?.id;

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const handleClose = () => {
    setImage(null);
    setIsUploading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!image || !workspaceSlug || !workspaceId) return;
    setIsUploading(true);

    try {
      const { asset_url } = await fileService.uploadWorkspaceAsset(
        workspaceSlug.toString(),
        { entity_identifier: workspaceId.toString(), entity_type: entityType },
        image
      );
      onSuccess(asset_url);
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
    if (!initialValue || !workspaceSlug || !workspaceId) return;
    setIsRemoving(true);
    try {
      if (checkURLValidity(initialValue)) {
        await fileService.deleteOldWorkspaceAssetV2(workspaceSlug, initialValue);
      } else {
        const assetId = getAssetIdFromUrl(initialValue);
        await fileService.deleteWorkspaceAsset(workspaceSlug, assetId);
      }
      await handleRemove();
    } catch (error) {
      console.log("Error removing image:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
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
                Upload Image
              </Dialog.Title>
              <div className="mt-4">
                <div
                  {...getRootProps()}
                  className="relative h-80 w-80 border-2 border-dashed border-custom-border-200 rounded-lg flex items-center justify-center cursor-pointer"
                >
                  {image || initialValue ? (
                    <img
                      src={image ? URL.createObjectURL(image) : getFileURL(initialValue ?? "")}
                      alt="Uploaded preview"
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-center">
                      <UserCircle2 className="mx-auto h-16 w-16 text-custom-text-200" />
                      <p className="text-sm text-custom-text-200">
                        {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
                      </p>
                    </div>
                  )}
                  <input {...getInputProps()} />
                </div>
                {fileRejections.length > 0 && (
                  <p className="text-red-500 text-sm mt-2">Invalid file or exceeds size limit (5 MB).</p>
                )}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="danger" size="sm" onClick={handleImageRemove} disabled={!initialValue || isRemoving}>
                  {isRemoving ? "Removing..." : "Remove Image"}
                </Button>
                <div className="flex gap-2">
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!image} loading={isUploading}>
                    {isUploading ? "Uploading..." : "Upload & Save"}
                  </Button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

export default AppImageUploadModal;
