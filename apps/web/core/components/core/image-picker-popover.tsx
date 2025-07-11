"use client";

import React, { useState, useRef, useCallback } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Control, Controller } from "react-hook-form";
import useSWR from "swr";
import { Tab, Popover } from "@headlessui/react";
// plane imports
import { ACCEPTED_COVER_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE, MAX_FILE_SIZE } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { EFileAssetType } from "@plane/types";
import { Button, Input, Loader, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useDropdownKeyDown } from "@/hooks/use-dropdown-key-down";
// services
import { FileService } from "@/services/file.service";

const tabOptions = [
  {
    key: "unsplash",
    title: "Unsplash",
  },
  {
    key: "images",
    title: "Images",
  },
  {
    key: "upload",
    title: "Upload",
  },
];

type Props = {
  label: string | React.ReactNode;
  value: string | null;
  control: Control<any>;
  onChange: (data: string) => void;
  disabled?: boolean;
  tabIndex?: number;
  isProfileCover?: boolean;
  projectId?: string | null;
};

// services
const fileService = new FileService();

export const ImagePickerPopover: React.FC<Props> = observer((props) => {
  const { label, value, control, onChange, disabled = false, tabIndex, isProfileCover = false, projectId } = props;
  // states
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [formData, setFormData] = useState({
    search: "",
  });
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // router params
  const { workspaceSlug } = useParams();

  const { data: unsplashImages, error: unsplashError } = useSWR(
    `UNSPLASH_IMAGES_${searchParams}`,
    () => fileService.getUnsplashImages(searchParams),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: projectCoverImages } = useSWR(`PROJECT_COVER_IMAGES`, () => fileService.getProjectCoverImages(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const imagePickerRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_COVER_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE,
    maxSize: MAX_FILE_SIZE,
  });

  const handleSubmit = async () => {
    if (!image) return;
    setIsImageUploading(true);

    const uploadCallback = (url: string) => {
      onChange(url);
      setIsImageUploading(false);
      setImage(null);
      setIsOpen(false);
    };

    if (isProfileCover) {
      await fileService
        .uploadUserAsset(
          {
            entity_identifier: "",
            entity_type: EFileAssetType.USER_COVER,
          },
          image
        )
        .then((res) => uploadCallback(res.asset_url))
        .catch((error) => {
          console.error("Error uploading user cover image:", error);
          setIsImageUploading(false);
          setToast({
            message: error?.error ?? "The image could not be uploaded",
            type: TOAST_TYPE.ERROR,
            title: "Image not uploaded",
          });
        });
    } else {
      if (!workspaceSlug) return;
      await fileService
        .uploadWorkspaceAsset(
          workspaceSlug.toString(),
          {
            entity_identifier: projectId?.toString() ?? "",
            entity_type: EFileAssetType.PROJECT_COVER,
          },
          image
        )
        .then((res) => uploadCallback(res.asset_url))
        .catch((error) => {
          console.error("Error uploading project cover image:", error);
          setIsImageUploading(false);
          setToast({
            message: error?.error ?? "The image could not be uploaded",
            type: TOAST_TYPE.ERROR,
            title: "Image not uploaded",
          });
        });
    }
  };

  const handleClose = () => {
    if (isOpen) setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(ref, handleClose);

  return (
    <Popover className="relative z-19" ref={ref} tabIndex={tabIndex} onKeyDown={handleKeyDown}>
      <Popover.Button
        className="rounded border border-custom-border-300 bg-custom-background-100 px-2 py-1 text-xs text-custom-text-200 hover:text-custom-text-100"
        onClick={handleOnClick}
        disabled={disabled}
      >
        {label}
      </Popover.Button>

      {isOpen && (
        <Popover.Panel
          className="absolute right-0 z-20 mt-2 rounded-md border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-sm"
          static
        >
          <div
            ref={imagePickerRef}
            className="flex h-96 w-80 flex-col overflow-auto rounded border border-custom-border-300 bg-custom-background-100 p-3 shadow-2xl md:h-[28rem] md:w-[36rem]"
          >
            <Tab.Group>
              <Tab.List as="span" className="inline-block rounded bg-custom-background-80 p-1">
                {tabOptions.map((tab) => {
                  if (!unsplashImages && unsplashError && tab.key === "unsplash") return null;
                  if (projectCoverImages && projectCoverImages.length === 0 && tab.key === "images") return null;

                  return (
                    <Tab
                      key={tab.key}
                      className={({ selected }) =>
                        `rounded px-4 py-1 text-center text-sm outline-none transition-colors ${
                          selected ? "bg-custom-primary text-white" : "text-custom-text-100"
                        }`
                      }
                    >
                      {tab.title}
                    </Tab>
                  );
                })}
              </Tab.List>
              <Tab.Panels className="vertical-scrollbar scrollbar-md h-full w-full flex-1 overflow-y-auto overflow-x-hidden">
                {(unsplashImages || !unsplashError) && (
                  <Tab.Panel className="mt-4 h-full w-full space-y-4">
                    <div className="flex gap-x-2">
                      <Controller
                        control={control}
                        name="search"
                        render={({ field: { value, ref } }) => (
                          <Input
                            id="search"
                            name="search"
                            type="text"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                setSearchParams(formData.search);
                              }
                            }}
                            value={value}
                            onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                            ref={ref}
                            placeholder="Search for images"
                            className="w-full text-sm"
                          />
                        )}
                      />
                      <Button variant="primary" onClick={() => setSearchParams(formData.search)} size="sm">
                        Search
                      </Button>
                    </div>
                    {unsplashImages ? (
                      unsplashImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                          {unsplashImages.map((image) => (
                            <div
                              key={image.id}
                              className="relative col-span-2 aspect-video md:col-span-1"
                              onClick={() => {
                                setIsOpen(false);
                                onChange(image.urls.regular);
                              }}
                            >
                              <img
                                src={image.urls.small}
                                alt={image.alt_description}
                                className="absolute left-0 top-0 h-full w-full cursor-pointer rounded object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="pt-7 text-center text-xs text-custom-text-300">No images found.</p>
                      )
                    ) : (
                      <Loader className="grid grid-cols-4 gap-4">
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                      </Loader>
                    )}
                  </Tab.Panel>
                )}
                {(!projectCoverImages || projectCoverImages.length !== 0) && (
                  <Tab.Panel className="mt-4 h-full w-full space-y-4">
                    {projectCoverImages ? (
                      projectCoverImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                          {projectCoverImages.map((image, index) => (
                            <div
                              key={image}
                              className="relative col-span-2 aspect-video md:col-span-1"
                              onClick={() => {
                                setIsOpen(false);
                                onChange(image);
                              }}
                            >
                              <img
                                src={image}
                                alt={`Default project cover image- ${index}`}
                                className="absolute left-0 top-0 h-full w-full cursor-pointer rounded object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="pt-7 text-center text-xs text-custom-text-300">No images found.</p>
                      )
                    ) : (
                      <Loader className="grid grid-cols-4 gap-4 pt-4">
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                        <Loader.Item height="80px" width="100%" />
                      </Loader>
                    )}
                  </Tab.Panel>
                )}
                <Tab.Panel className="mt-4 h-full w-full">
                  <div className="flex h-full w-full flex-col gap-y-2">
                    <div className="flex w-full flex-1 items-center gap-3">
                      <div
                        {...getRootProps()}
                        className={`relative grid h-full w-full cursor-pointer place-items-center rounded-lg p-12 text-center focus:outline-none focus:ring-2 focus:ring-custom-primary focus:ring-offset-2 ${
                          (image === null && isDragActive) || !value
                            ? "border-2 border-dashed border-custom-border-200 hover:bg-custom-background-90"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="absolute right-0 top-0 z-40 -translate-y-1/2 rounded bg-custom-background-90 px-2 py-0.5 text-xs font-medium text-custom-text-200"
                        >
                          Edit
                        </button>
                        {image !== null || (value && value !== "") ? (
                          <>
                            <Image
                              layout="fill"
                              objectFit="cover"
                              src={image ? URL.createObjectURL(image) : value ? (getFileURL(value) ?? "") : ""}
                              alt="image"
                              className="rounded-lg"
                            />
                          </>
                        ) : (
                          <div>
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

                    <p className="text-sm text-custom-text-200">File formats supported- .jpeg, .jpg, .png, .webp</p>

                    <div className="flex h-12 items-start justify-end gap-2">
                      <Button
                        variant="neutral-primary"
                        onClick={() => {
                          setIsOpen(false);
                          setImage(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!image}
                        loading={isImageUploading}
                      >
                        {isImageUploading ? "Uploading..." : "Upload & Save"}
                      </Button>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Popover.Panel>
      )}
    </Popover>
  );
});
