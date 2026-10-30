/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React, { useState, useRef, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import useSWR from "swr";
// plane imports
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { Tab, Tabs, TabsList, TabsPanel } from "@makeplane/propel/components/tabs";
import { ACCEPTED_COVER_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE, MAX_FILE_SIZE } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Button as ButtonElement } from "@makeplane/propel/elements/button";
import { setToast } from "@plane/blocks/toast";
import { EFileAssetType } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
// helpers
import { STATIC_COVER_IMAGES, getCoverImageDisplayURL } from "@/helpers/cover-image.helper";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// services
import { FileService } from "@/services/file.service";

type TTabOption = {
  key: string;
  title: string;
  isEnabled: boolean;
};

// Generic over the form's values because react-hook-form's Control is invariant: its
// `_options.validate` narrows `name` to a keyof union, so `Control<any>` no longer
// accepts a typed form's control. Inferring from `control` keeps call sites unchanged.
type Props<TFieldValues extends FieldValues = FieldValues> = {
  label: string | React.ReactNode;
  value: string | null;
  control: Control<TFieldValues>;
  onChange: (data: string) => void;
  disabled?: boolean;
  tabIndex?: number;
  isProfileCover?: boolean;
  projectId?: string | null;
};

// services
const fileService = new FileService();

function ImagePickerPopoverComponent<TFieldValues extends FieldValues = FieldValues>(props: Props<TFieldValues>) {
  const { t } = useTranslation();

  const { label, value, control, onChange, disabled = false, tabIndex, isProfileCover = false, projectId } = props;
  // states
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [formData, setFormData] = useState({
    search: "",
  });
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { config } = useInstance();
  // derived values
  const hasUnsplashConfigured = config?.has_unsplash_configured || false;
  const tabOptions: TTabOption[] = useMemo(
    () => [
      {
        key: "unsplash",
        title: "Unsplash",
        isEnabled: hasUnsplashConfigured,
      },
      {
        key: "images",
        title: t("web_ui.images"),
        isEnabled: true,
      },
      {
        key: "upload",
        title: t("web_ui.upload"),
        isEnabled: true,
      },
    ],
    [t, hasUnsplashConfigured]
  );

  const enabledTabs = useMemo(() => tabOptions.filter((tab) => tab.isEnabled), [tabOptions]);

  const { data: unsplashImages, error: unsplashError } = useSWR(
    `UNSPLASH_IMAGES_${searchParams}`,
    () => fileService.getUnsplashImages(searchParams),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const imagePickerRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_COVER_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE,
    maxSize: MAX_FILE_SIZE,
  });

  const handleStaticImageSelect = (imageUrl: string) => {
    onChange(imageUrl);
    setIsOpen(false);
  };

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
            type: "error",
            title: t("web_ui.image_not_uploaded"),
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
            type: "error",
            title: t("web_ui.image_not_uploaded"),
          });
        });
    }
  };

  return (
    // The popover owns the portal, positioning, outside press and Escape, so the outside-click
    // detector and the dropdown key handler go (Ruling 36).
    <div className="relative z-19">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <ButtonElement
              variant="secondary"
              size="xs"
              stretch="auto"
              disabled={disabled}
              tabIndex={tabIndex}
              // The trigger sits inside clickable cover-image chrome; the press must not reach it.
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
          }
        >
          {label}
        </PopoverTrigger>
        <PopoverContent variant="rich" side="bottom" align="end" sideOffset={8} data-prevent-outside-click>
          <PopoverBody tabIndex={0}>
            <div ref={imagePickerRef} className="flex h-96 w-80 flex-col overflow-hidden md:h-[36rem] md:w-[36rem]">
              {/* Row wrapper: published Tabs omits className, so fill height comes from stretch. The
                  popup supplies the panel padding. */}
              <div className="flex h-full min-h-0 w-full">
                <Tabs variant="contained" defaultValue={enabledTabs[0]?.key || "images"}>
                  <div className="flex h-full min-h-0 w-full flex-col">
                    {/* Published TabsList is inline-flex; stretch it to the previous full-width bar. */}
                    <div className="w-full min-w-0 [&_[role=tab]]:min-w-0 [&_[role=tab]]:flex-1 [&_[role=tablist]]:flex [&_[role=tablist]]:w-full">
                      <TabsList>
                        {enabledTabs.map((tab) => (
                          <Tab key={tab.key} value={tab.key} label={tab.title} />
                        ))}
                      </TabsList>
                    </div>
                    {/* Grid wrapper: published TabsPanel omits className, so fill height comes from a one-row grid. */}
                    <div className="vertical-scrollbar mt-3 scrollbar-sm grid min-h-0 w-full flex-1 grid-rows-1 overflow-x-hidden overflow-y-auto p-3">
                      <TabsPanel value="unsplash">
                        <div className="space-y-4">
                          {(unsplashImages || !unsplashError) && (
                            <>
                              <div className="flex items-center gap-x-2">
                                <Controller
                                  control={control}
                                  name={"search" as FieldPath<TFieldValues>}
                                  render={({ field: { value: nextValue, ref } }) => (
                                    <InputGroup size="2xl">
                                      <Input
                                        size="2xl"
                                        id="search"
                                        name="search"
                                        type="text"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            setSearchParams(formData.search);
                                          }
                                        }}
                                        value={nextValue}
                                        onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                                        ref={ref}
                                        placeholder={t("web_ui.search_for_images")}
                                      />
                                    </InputGroup>
                                  )}
                                />
                                <Button
                                  variant="primary"
                                  size="lg"
                                  stretch="auto"
                                  label={t("search")}
                                  onClick={() => setSearchParams(formData.search)}
                                />
                              </div>
                              {unsplashImages ? (
                                unsplashImages.length > 0 ? (
                                  <div className="grid grid-cols-4 gap-4">
                                    {unsplashImages.map((nextImage) => (
                                      <button
                                        type="button"
                                        key={nextImage.id}
                                        className="relative col-span-2 aspect-video md:col-span-1"
                                        aria-label={
                                          nextImage.alt_description
                                            ? `Select image: ${nextImage.alt_description}`
                                            : t("web_ui.select_image")
                                        }
                                        onClick={() => {
                                          setIsOpen(false);
                                          onChange(nextImage.urls.regular);
                                        }}
                                      >
                                        <img
                                          src={nextImage.urls.small}
                                          alt={nextImage.alt_description}
                                          className="absolute top-0 left-0 h-full w-full cursor-pointer rounded-sm object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="pt-7 text-center text-11 text-secondary">
                                    {t("web_ui.no_images_found")}
                                  </p>
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
                            </>
                          )}
                        </div>
                      </TabsPanel>
                      <TabsPanel value="images">
                        <div className="grid grid-cols-4 gap-4">
                          {Object.values(STATIC_COVER_IMAGES).map((imageUrl, index) => (
                            <button
                              type="button"
                              key={imageUrl}
                              className="relative col-span-2 aspect-video md:col-span-1"
                              aria-label={t("web_ui.dynamic_select_cover_image_value0", { value0: index + 1 })}
                              onClick={() => handleStaticImageSelect(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={t("web_ui.dynamic_cover_image_value0", { value0: index + 1 })}
                                className="absolute top-0 left-0 h-full w-full cursor-pointer rounded-sm object-cover transition-opacity hover:opacity-80"
                              />
                            </button>
                          ))}
                        </div>
                      </TabsPanel>
                      <TabsPanel value="upload">
                        <div className="flex h-full w-full flex-col gap-y-2">
                          <div className="flex w-full flex-1 items-center gap-3">
                            <div
                              {...getRootProps()}
                              className={`relative grid h-full w-full cursor-pointer place-items-center rounded-lg p-12 text-center focus:ring-2 focus:ring-accent-strong focus:ring-offset-2 focus:outline-none ${
                                (image === null && isDragActive) || !value
                                  ? "border-2 border-dashed border-subtle hover:bg-surface-2"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="absolute top-0 right-0 z-40 -translate-y-1/2 rounded-sm bg-surface-2 px-2 py-0.5 text-11 font-medium text-secondary"
                              >
                                {t("edit")}{" "}
                              </button>
                              {image !== null || (value && value !== "") ? (
                                <>
                                  <img
                                    src={image ? URL.createObjectURL(image) : getCoverImageDisplayURL(value, "")}
                                    alt={t("web_ui.image")}
                                    className="h-full w-full rounded-lg object-cover"
                                  />
                                </>
                              ) : (
                                <div>
                                  <span className="mt-2 block text-13 font-medium text-secondary">
                                    {isDragActive ? t("web_ui.drop_image_here_to_upload") : "Drag & drop image here"}
                                  </span>
                                </div>
                              )}

                              <input {...getInputProps()} />
                            </div>
                          </div>
                          {fileRejections.length > 0 && (
                            <p className="text-13 text-danger-primary">
                              {fileRejections[0].errors[0].code === "file-too-large"
                                ? "The image size cannot exceed 5 MB."
                                : t("web_ui.please_upload_a_file_in_a_valid_format")}
                            </p>
                          )}

                          <p className="text-13 text-secondary">
                            {t("web_ui.file_formats_supported_jpeg_jpg_png_webp")}
                          </p>

                          <div className="flex h-12 items-start justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              stretch="auto"
                              label={t("cancel")}
                              onClick={() => {
                                setIsOpen(false);
                                setImage(null);
                              }}
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              stretch="full"
                              label={
                                isImageUploading
                                  ? t("project.members_import.progress.uploading")
                                  : t("workspace_settings.settings.applications.upload_and_save")
                              }
                              onClick={handleSubmit}
                              disabled={!image}
                              loading={isImageUploading}
                            />
                          </div>
                        </div>
                      </TabsPanel>
                    </div>
                  </div>
                </Tabs>
              </div>
            </div>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// observer() erases the generic signature, so restore it with a cast.
export const ImagePickerPopover = observer(ImagePickerPopoverComponent) as typeof ImagePickerPopoverComponent;
