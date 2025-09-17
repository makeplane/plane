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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@plane/propel/tabs";
import { EFileAssetType } from "@plane/types";
import { Button, Input, Loader, TOAST_TYPE, setToast } from "@plane/ui";
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
            className="flex h-96 w-80 flex-col rounded border border-custom-border-300 bg-custom-background-100 p-3 shadow-2xl md:h-[28rem] md:w-[36rem] overflow-hidden flex-1"
          >
            <Tabs defaultValue={tabOptions[0].key}>
              <TabsList>
                {tabOptions.map((tab) => {
                  if (!unsplashImages && unsplashError && tab.key === "unsplash") return null;
                  if (projectCoverImages && projectCoverImages.length === 0 && tab.key === "images") return null;

                  return (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.title}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="unsplash" className="pt-4">
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
              </TabsContent>

              {(!projectCoverImages || projectCoverImages.length !== 0) && (
                <TabsContent value="images" className="pt-4 flex-1 h-full overflow-auto">
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
                              alt={`Project cover ${index + 1}`}
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
                </TabsContent>
              )}

              <TabsContent value="upload" className="pt-4">
                <div className="flex flex-1 w-full flex-col gap-y-2">
                  <div className="flex w-full flex-1 items-center gap-3">
                    <div
                      {...getRootProps()}
                      className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                        isDragActive
                          ? "border-custom-primary bg-custom-primary/10"
                          : "border-custom-border-200 hover:border-custom-border-300"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-custom-background-80">
                            <svg
                              className="h-4 w-4 text-custom-text-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-custom-text-200">
                            {isDragActive ? "Drop image here to upload" : "Drag & drop image here"}
                          </span>
                        </div>
                        <span className="text-xs text-custom-text-400">
                          {Object.keys(ACCEPTED_COVER_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE).join(", ")} (Max{" "}
                          {MAX_FILE_SIZE / 1024 / 1024}MB)
                        </span>
                      </div>
                    </div>
                  </div>
                  {image && (
                    <div className="flex w-full items-center gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Preview"
                          className="h-full w-full rounded object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-sm font-medium text-custom-text-100">{image.name}</p>
                        <p className="text-xs text-custom-text-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        onClick={() => setImage(null)}
                        disabled={isImageUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {fileRejections.length > 0 && (
                    <div className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-sm font-medium text-red-800">File rejected</p>
                        <p className="text-xs text-red-600">{fileRejections[0].errors[0].message}</p>
                      </div>
                    </div>
                  )}
                  {image && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isImageUploading}
                      className="mt-auto"
                    >
                      {isImageUploading ? "Uploading..." : "Upload & Save"}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Popover.Panel>
      )}
    </Popover>
  );
});
