import React, { useEffect, useState, useRef } from "react";

// next
import Image from "next/image";

// swr
import useSWR from "swr";

// headless ui
import { Tab, Transition, Popover } from "@headlessui/react";

// services
import fileService from "services/file.service";

// components
import { Input, Spinner } from "components/ui";
import { PrimaryButton } from "components/ui/button/primary-button";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";

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

  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useState("");
  const [formData, setFormData] = useState({
    search: "",
  });

  const { data: images } = useSWR(`UNSPLASH_IMAGES_${searchParams}`, () =>
    fileService.getUnsplashImages(1, searchParams)
  );

  useOutsideClickDetector(ref, () => {
    setIsOpen(false);
  });

  useEffect(() => {
    if (!images || value !== null) return;
    onChange(images[0].urls.regular);
  }, [value, onChange, images]);

  return (
    <Popover className="relative z-[2]" ref={ref}>
      <Popover.Button
        className="rounded-md border border-gray-500 bg-white px-2 py-1 text-xs text-gray-700"
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
        <Popover.Panel className="absolute right-0 z-10 mt-2 rounded-md bg-white shadow-lg">
          <div className="h-96 w-80 overflow-auto rounded border bg-white p-5 shadow-2xl sm:max-w-2xl md:w-96 lg:w-[40rem]">
            <Tab.Group>
              <Tab.List as="span" className="inline-block rounded bg-gray-200 p-1">
                {tabOptions.map((tab) => (
                  <Tab
                    key={tab.key}
                    className={({ selected }) =>
                      `rounded py-1 px-4 text-center text-sm outline-none transition-colors ${
                        selected ? "bg-theme text-white" : "text-black"
                      }`
                    }
                  >
                    {tab.title}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="h-full w-full flex-1 overflow-y-auto overflow-x-hidden">
                <Tab.Panel className="h-full w-full space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSearchParams(formData.search);
                    }}
                    className="flex gap-x-2 pt-7"
                  >
                    <Input
                      name="search"
                      className="text-sm"
                      id="search"
                      value={formData.search}
                      onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                      placeholder="Search for images"
                    />
                    <PrimaryButton className="bg-indigo-600" size="sm">
                      Search
                    </PrimaryButton>
                  </form>
                  {images ? (
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative col-span-2 aspect-video md:col-span-1"
                        >
                          <Image
                            src={image.urls.small}
                            alt={image.alt_description}
                            layout="fill"
                            objectFit="cover"
                            className="cursor-pointer rounded"
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
                <Tab.Panel className="flex h-full w-full flex-col items-center justify-center">
                  <p>Coming Soon...</p>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
