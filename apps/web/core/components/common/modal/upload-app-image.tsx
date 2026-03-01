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
import { useDropzone } from "react-dropzone";
import { Button } from "@plane/propel/button";
import { UserCirclePropertyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import type { EFileAssetType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { checkURLValidity, getAssetIdFromUrl, getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
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

export const AppImageUploadModal = observer(function AppImageUploadModal(props: Props) {
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="px-5 py-8">
        <h3 className="text-16 font-medium text-primary">Upload Image</h3>
        <div className="mt-4">
          <div
            {...getRootProps()}
            className="relative h-80 w-80 border-2 border-dashed border-subtle-1 rounded-lg flex items-center justify-center cursor-pointer"
          >
            {image || initialValue ? (
              <img
                src={image ? URL.createObjectURL(image) : getFileURL(initialValue ?? "")}
                alt="Uploaded preview"
                className="h-full w-full object-cover rounded-md"
              />
            ) : (
              <div className="text-center">
                <UserCirclePropertyIcon className="mx-auto h-16 w-16 text-secondary" />
                <p className="text-13 text-secondary">
                  {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
              </div>
            )}
            <input {...getInputProps()} />
          </div>
          {fileRejections.length > 0 && (
            <p className="text-danger-primary text-13 mt-2">Invalid file or exceeds size limit (5 MB).</p>
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="error-fill" onClick={handleImageRemove} disabled={!initialValue || isRemoving}>
            {isRemoving ? "Removing..." : "Remove Image"}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!image} loading={isUploading}>
              {isUploading ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});

export default AppImageUploadModal;
