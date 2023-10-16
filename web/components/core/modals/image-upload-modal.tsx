import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

// react-dropzone
import { useDropzone } from "react-dropzone";
// headless ui
import { Transition, Dialog } from "@headlessui/react";
// services
import { FileService } from "services/file.service";
// hooks
import useWorkspaceDetails from "hooks/use-workspace-details";
// ui
import { Button } from "@plane/ui";
// icons
import { UserCircleIcon } from "components/icons";

type Props = {
  value?: string | null;
  onClose: () => void;
  isOpen: boolean;
  onSuccess: (url: string) => void;
  isRemoving: boolean;
  handleDelete: () => void;
  userImage?: boolean;
};

// services
const fileService = new FileService();

export const ImageUploadModal: React.FC<Props> = ({
  value,
  onSuccess,
  isOpen,
  onClose,
  isRemoving,
  handleDelete,
  userImage,
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { workspaceDetails } = useWorkspaceDetails();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".svg", ".webp"],
    },
    maxSize: 5 * 1024 * 1024,
  });

  const handleSubmit = async () => {
    setIsImageUploading(true);

    if (!image || !workspaceSlug) return;

    const formData = new FormData();
    formData.append("asset", image);
    formData.append("attributes", JSON.stringify({}));

    if (userImage) {
      fileService
        .uploadUserFile(formData)
        .then((res) => {
          const imageUrl = res.asset;

          onSuccess(imageUrl);
          setIsImageUploading(false);
          setImage(null);

          if (value) fileService.deleteUserFile(value);
        })
        .catch((err) => {
          console.error(err);
        });
    } else
      fileService
        .uploadFile(workspaceSlug as string, formData)
        .then((res) => {
          const imageUrl = res.asset;
          onSuccess(imageUrl);
          setIsImageUploading(false);
          setImage(null);

          if (value && workspaceDetails) fileService.deleteFile(workspaceDetails.id, value);
        })
        .catch((err) => {
          console.error(err);
        });
  };

  const handleClose = () => {
    setImage(null);
    onClose();
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-xl sm:p-6">
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
                              className="absolute top-0 right-0 z-40 translate-x-1/2 -translate-y-1/2 rounded bg-custom-background-90 px-2 py-0.5 text-xs font-medium text-custom-text-200"
                            >
                              Edit
                            </button>
                            <img
                              src={image ? URL.createObjectURL(image) : value ? value : ""}
                              alt="image"
                              className="absolute top-0 left-0 h-full w-full object-cover rounded-md"
                            />
                          </>
                        ) : (
                          <div>
                            <UserCircleIcon className="mx-auto h-16 w-16 text-custom-text-200" />
                            <span className="mt-2 block text-sm font-medium text-custom-text-200">
                              {isDragActive ? "Drop image here to upload" : "Drag & drop image here"}
                            </span>
                          </div>
                        )}

                        <input {...getInputProps()} type="text" />
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
                <p className="my-4 text-custom-text-200 text-sm">
                  File formats supported- .jpeg, .jpg, .png, .webp, .svg
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button variant="danger" onClick={handleDelete} disabled={!value}>
                      {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="neutral-primary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!image} loading={isImageUploading}>
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
};
