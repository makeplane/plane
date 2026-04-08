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
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import type { EFileAssetType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";
import { Image, X } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";

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
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
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

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-16 font-medium text-primary">Upload Image</h3>
          <IconButton variant="ghost" icon={X} onClick={handleClose} />
        </div>
        <div
          {...getRootProps()}
          className="relative h-50 w-full border border-dashed border-accent-strong rounded-lg flex items-center justify-center cursor-pointer"
        >
          {isDragActive ? (
            <div className="size-45 bg-layer-1 rounded-md"></div>
          ) : image || initialValue ? (
            <img
              src={image ? URL.createObjectURL(image) : getFileURL(initialValue ?? "")}
              alt="Uploaded preview"
              className="size-45 object-cover rounded-md"
            />
          ) : (
            <div className="text-center flex flex-col gap-2">
              <Image className="mx-auto h-6 w-6 text-accent-primary" />
              <div className="text-caption-md-regular text-accent-primary">Click to upload or drag and drop</div>
              <div className="text-caption-sm-medium text-placeholder">
                File formats supported- .jpeg, .jpg, .png, .webp
              </div>
            </div>
          )}
          <input {...getInputProps()} />
        </div>
        {fileRejections.length > 0 && (
          <p className="text-danger-primary text-13 mt-2">Failed to upload file. Please try again.</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!image} loading={isUploading}>
            {isUploading ? "Uploading..." : "Upload & Save"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

export default AppImageUploadModal;
