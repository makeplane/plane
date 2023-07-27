import React, { useEffect, useState, useRef, useCallback } from "react";

// next
import Image from "next/image";
import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// react-dropdown
import { useDropzone } from "react-dropzone";

// headless ui
import { Tab, Transition, Popover } from "@headlessui/react";

// services
import fileService from "services/file.service";

// components
import { Input, Spinner, PrimaryButton } from "components/ui";
// hooks
import useWorkspaceDetails from "hooks/use-workspace-details";
import useOutsideClickDetector from "hooks/use-outside-click-detector";

const unsplashEnabled =
  process.env.NEXT_PUBLIC_UNSPLASH_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_UNSPLASH_ENABLED === "1";

const tabOptions = [
  {
    key: "unsplash",
    title: "Unsplash",
  },
  {
    key: "upload",
    title: "Upload",
  },
];

type Props = {
  label: string | React.ReactNode;
  value: string | null;
  onChange: (data: string) => void;
};

export const ImagePickerPopover: React.FC<Props> = ({ label, value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [formData, setFormData] = useState({
    search: "",
  });

  const { data: images } = useSWR(`UNSPLASH_IMAGES_${searchParams}`, () =>
    fileService.getUnsplashImages(1, searchParams)
  );

  const { workspaceDetails } = useWorkspaceDetails();

  useOutsideClickDetector(ref, () => {
    setIsOpen(false);
  });

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

    fileService
      .uploadFile(workspaceSlug.toString(), formData)
      .then((res) => {
        const oldValue = value;
        const isUnsplashImage = oldValue?.split("/")[2] === "images.unsplash.com";

        const imageUrl = res.asset;
        onChange(imageUrl);
        setIsImageUploading(false);
        setImage(null);

        if (isUnsplashImage) return;

        if (oldValue && workspaceDetails) fileService.deleteFile(workspaceDetails.id, oldValue);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (!images || value !== null) return;
    onChange(images[0].urls.regular);
  }, [value, onChange, images]);

  if (!unsplashEnabled) return null;

  return (
    <Popover className="relative z-[2]" ref={ref}>
      <Popover.Button
        className="rounded-md border border-custom-border-300 bg-custom-background-100 px-2 py-1 text-xs text-custom-text-200 hover:text-custom-text-100"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {label}
      </Popover.Button>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel className="absolute right-0 z-10 mt-2 rounded-md border border-custom-border-200 bg-custom-background-80 shadow-lg">
          <div className="h-96 flex flex-col w-80 overflow-auto rounded border border-custom-border-300 bg-custom-background-100 p-3 shadow-2xl sm:max-w-2xl md:w-96 lg:w-[40rem]">
            <Tab.Group>
              <div>
                <Tab.List as="span" className="inline-block rounded bg-custom-background-80 p-1">
                  {tabOptions.map((tab) => (
                    <Tab
                      key={tab.key}
                      className={({ selected }) =>
                        `rounded py-1 px-4 text-center text-sm outline-none transition-colors ${
                          selected ? "bg-custom-primary text-white" : "text-custom-text-100"
                        }`
                      }
                    >
                      {tab.title}
                    </Tab>
                  ))}
                </Tab.List>
              </div>
              <Tab.Panels className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden">
                <Tab.Panel className="h-full w-full space-y-4">
                  <div className="flex gap-x-2 pt-7">
                    <Input
                      name="search"
                      className="text-sm"
                      id="search"
                      value={formData.search}
                      onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                      placeholder="Search for images"
                    />
                    <PrimaryButton onClick={() => setSearchParams(formData.search)} size="sm">
                      Search
                    </PrimaryButton>
                  </div>
                  {images ? (
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative col-span-2 aspect-video md:col-span-1"
                        >
                          <img
                            src={image.urls.small}
                            alt={image.alt_description}
                            className="cursor-pointer rounded absolute top-0 left-0 h-full w-full object-cover"
                            onClick={() => {
                              setIsOpen(false);
                              onChange(image.urls.regular);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center pt-20">
                      <Spinner />
                    </div>
                  )}
                </Tab.Panel>
                <Tab.Panel className="h-full w-full flex flex-col items-center justify-center">
                  <div className="w-full h-full flex flex-col py-5">
                    <div className="flex items-center gap-3 w-full flex-1">
                      <div
                        {...getRootProps()}
                        className={`relative grid h-80 w-full cursor-pointer place-items-center rounded-lg p-12 text-center focus:outline-none focus:ring-2 focus:ring-custom-primary focus:ring-offset-2 ${
                          (image === null && isDragActive) || !value
                            ? "border-2 border-dashed border-custom-border-200 hover:bg-custom-background-90"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="absolute top-0 right-0 z-40 -translate-y-1/2 rounded bg-custom-background-90 px-2 py-0.5 text-xs font-medium text-custom-text-200"
                        >
                          Edit
                        </button>
                        {image !== null || (value && value !== "") ? (
                          <>
                            <Image
                              layout="fill"
                              objectFit="cover"
                              src={image ? URL.createObjectURL(image) : value ? value : ""}
                              alt="image"
                              className="rounded-lg"
                            />
                          </>
                        ) : (
                          <div>
                            <span className="mt-2 block text-sm font-medium text-custom-text-200">
                              {isDragActive
                                ? "Drop image here to upload"
                                : "Drag & drop image here"}
                            </span>
                          </div>
                        )}

                        <input {...getInputProps()} type="text" />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6 flex justify-end flex-auto">
                      <PrimaryButton
                        onClick={handleSubmit}
                        disabled={!image}
                        loading={isImageUploading}
                      >
                        {isImageUploading ? "Uploading..." : "Upload & Save"}
                      </PrimaryButton>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
