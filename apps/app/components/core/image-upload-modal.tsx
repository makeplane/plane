import React, { useCallback, useState } from "react";

import NextImage from "next/image";
import { useRouter } from "next/router";

// react-dropzone
import { useDropzone } from "react-dropzone";
// headless ui
import { Transition, Dialog } from "@headlessui/react";
// services
import fileServices from "services/file.service";
// hooks
import useWorkspaceDetails from "hooks/use-workspace-details";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { UserCircleIcon } from "components/icons";

type Props = {
  value?: string | null;
  onClose: () => void;
  isOpen: boolean;
  onSuccess: (url: string) => void;
  userImage?: boolean;
};

export const ImageUploadModal: React.FC<Props> = ({
  value,
  onSuccess,
  isOpen,
  onClose,
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleSubmit = async () => {
    setIsImageUploading(true);

    if (!image || !workspaceSlug) return;

    const formData = new FormData();
    formData.append("asset", image);
    formData.append("attributes", JSON.stringify({}));

    if (userImage) {
      fileServices
        .uploadUserFile(formData)
        .then((res) => {
          const imageUrl = res.asset;

          onSuccess(imageUrl);
          setIsImageUploading(false);
          setImage(null);

          if (value) fileServices.deleteUserFile(value);
        })
        .catch((err) => {
          console.error(err);
        });
    } else
      fileServices
        .uploadFile(workspaceSlug as string, formData)
        .then((res) => {
          const imageUrl = res.asset;
          onSuccess(imageUrl);
          setIsImageUploading(false);
          setImage(null);

          if (value && workspaceDetails) fileServices.deleteFile(workspaceDetails.id, value);
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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-brand-base bg-brand-base px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-xl sm:p-6">
                <div className="space-y-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-brand-base">
                    Upload Image
                  </Dialog.Title>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        {...getRootProps()}
                        className={`relative grid h-80 w-full cursor-pointer place-items-center rounded-lg p-12 text-center focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 ${
                          (image === null && isDragActive) || !value
                            ? "border-2 border-dashed border-brand-base hover:bg-brand-surface-1"
                            : ""
                        }`}
                      >
                        {image !== null || (value && value !== "") ? (
                          <>
                            <button
                              type="button"
                              className="absolute top-0 right-0 z-40 translate-x-1/2 -translate-y-1/2 rounded bg-brand-surface-1 px-2 py-0.5 text-xs font-medium text-brand-secondary"
                            >
                              Edit
                            </button>
                            <NextImage
                              layout="fill"
                              objectFit="cover"
                              src={image ? URL.createObjectURL(image) : value ? value : ""}
                              alt="image"
                              className="rounded-lg"
                            />
                          </>
                        ) : (
                          <div>
                            <UserCircleIcon className="mx-auto h-16 w-16 text-brand-secondary" />
                            <span className="mt-2 block text-sm font-medium text-brand-secondary">
                              {isDragActive
                                ? "Drop image here to upload"
                                : "Drag & drop image here"}
                            </span>
                          </div>
                        )}

                        <input {...getInputProps()} type="text" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                  <PrimaryButton
                    onClick={handleSubmit}
                    disabled={!image}
                    loading={isImageUploading}
                  >
                    {isImageUploading ? "Uploading..." : "Upload & Save"}
                  </PrimaryButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
