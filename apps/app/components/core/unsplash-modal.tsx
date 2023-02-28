import React, { useState } from "react";

import Image from "next/image";

import useSWR from "swr";

import { Dialog, Transition } from "@headlessui/react";

// services
import fileService from "services/file.service";
// ui
import { Button, Input, Spinner } from "components/ui";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onSelect: (url: string) => void;
};

export const UnsplashImageModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, onSelect } = props;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState({
    search: "",
  });

  const { data: images } = useSWR(`UNSPLASH_IMAGES_${searchQuery.toUpperCase()}`, () =>
    fileService.getUnsplashImages(1, searchQuery)
  );

  const onClose = () => {
    handleClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative h-[35rem] space-y-5 transform overflow-y-auto rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl sm:p-6">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Select an image
                </Dialog.Title>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearchQuery(formData.search);
                  }}
                  className="flex items-center"
                >
                  <Input
                    name="search"
                    value={formData.search}
                    onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                    placeholder="Search for images"
                  />
                  <Button type="submit">Search</Button>
                </form>

                {images ? (
                  <div className="grid grid-cols-3 gap-5">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        className="w-full relative h-32 bg-gray-200 rounded-md overflow-hidden"
                        type="button"
                        onClick={() => onSelect(image.urls.small)}
                      >
                        <Image src={image.urls.small} layout="fill" objectFit="cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-96 w-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
