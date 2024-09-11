"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { UserCircle2 } from "lucide-react";
import { Transition, Dialog } from "@headlessui/react";
// hooks
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { MAX_FILE_SIZE } from "@/constants/common";
// hooks
import { useInstance } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";

type Props = {
  handleDelete?: () => void;
  isOpen: boolean;
  isRemoving: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  value: string | null;
};

// services
const fileService = new FileService();

export const UserImageUploadModal: React.FC<Props> = observer((props) => {
  const { value, onSuccess, isOpen, onClose, isRemoving, handleDelete } = props;
  // states
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // store hooks
  const { config } = useInstance();

  const onDrop = (acceptedFiles: File[]) => setImage(acceptedFiles[0]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: config?.file_size_limit ?? MAX_FILE_SIZE,
    multiple: false,
  });

  const handleClose = () => {
    setImage(null);
    setIsImageUploading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!image) return;

    setIsImageUploading(true);

    const formData = new FormData();
    formData.append("asset", image);
    formData.append("attributes", JSON.stringify({}));

    fileService
      .uploadUserFile(formData)
      .then((res) => {
        const imageUrl = res.asset;

        onSuccess(imageUrl);
        setImage(null);

        if (value) fileService.deleteUserFile(value);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsImageUploading(false));
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-xl sm:p-6">
                <div className="space-y-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                    Upload Image
                  </Dialog.Title>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div
                        {...getRootProps()}
                        className={`relative grid h-80 w-80 cursor-pointer place-items-center rounded-lg p-12 text-center focus:outline-none focus:ring-2 focus:ring-custom-primary focus:ring-offset-2 ${
                          (image === null && isDragActive) || !value
                            ? "border-2 border-dashed border-custom-border-200 hover:bg-custom-background-90"
                            : ""
                        }`}
                      >
                        {image !== null || (value && value !== "") ? (
                          <>
                            <button
                              type="button"
                              className="absolute right-0 top-0 z-40 -translate-y-1/2 translate-x-1/2 rounded bg-custom-background-90 px-2 py-0.5 text-xs font-medium text-custom-text-200"
                            >
                              Edit
                            </button>
                            <img
                              src={image ? URL.createObjectURL(image) : value ? value : ""}
                              alt="image"
                              className="absolute left-0 top-0 h-full w-full rounded-md object-cover"
                            />
                          </>
                        ) : (
                          <div>
                            <UserCircle2 className="mx-auto h-16 w-16 text-custom-text-200" />
                            <span className="mt-2 block text-sm font-medium text-custom-text-200">
                              {isDragActive ? "Drop image here to upload" : "Drag & drop image here"}
                            </span>
                          </div>
                        )}

                        <input {...getInputProps()} />
                      </div>
                    </div>
                    {fileRejections.length > 0 && (
                      <p className="text-sm text-red-500">
                        {fileRejections[0].errors[0].code === "file-too-large"
                          ? "The image size cannot exceed 5 MB."
                          : "Please upload a file in a valid format."}
                      </p>
                    )}
                  </div>
                </div>
                <p className="my-4 text-sm text-custom-text-200">File formats supported- .jpeg, .jpg, .png, .webp</p>
                <div className="flex items-center justify-between">
                  {handleDelete && (
                    <Button variant="danger" size="sm" onClick={handleDelete} disabled={!value}>
                      {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!image}
                      loading={isImageUploading}
                    >
                      {isImageUploading ? "Uploading..." : "Upload & Save"}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
