import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

import { useForm } from "react-hook-form";

import { Dialog, Transition } from "@headlessui/react";
// services
import modulesService from "lib/services/modules.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button, Input } from "ui";
// types
import type { IModule, ModuleLink } from "types";
// fetch-keys
import { MODULE_DETAIL, MODULE_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  module: IModule | undefined;
  handleClose: () => void;
};

const defaultValues: ModuleLink = {
  title: "",
  url: "",
};

const ModuleLinkModal: React.FC<Props> = ({ isOpen, module, handleClose }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onSubmit = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !module) return;

    const previousLinks = module.link_module.map((l) => {
      return { title: l.title, url: l.url };
    });

    const payload: Partial<IModule> = {
      links_list: [...previousLinks, formData],
    };

    await modulesService
      .patchModule(workspaceSlug as string, projectId as string, module.id, payload)
      .then((res) => {
        mutate<IModule[]>(projectId && MODULE_LIST(projectId as string), (prevData) =>
          (prevData ?? []).map((module) => {
            if (module.id === moduleId) return { ...module, ...payload };
            return module;
          })
        );
        onClose();
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          setError(key as keyof ModuleLink, {
            message: err[key].join(", "),
          });
        });
      });
  };

  const onClose = () => {
    handleClose();
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <div className="space-y-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Add Link
                      </Dialog.Title>
                      <div className="mt-2 space-y-3">
                        <div>
                          <Input
                            id="title"
                            label="Title"
                            name="title"
                            type="text"
                            placeholder="Enter title"
                            autoComplete="off"
                            error={errors.title}
                            register={register}
                            validations={{
                              required: "Title is required",
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            id="url"
                            label="URL"
                            name="url"
                            type="url"
                            placeholder="Enter URL"
                            autoComplete="off"
                            error={errors.url}
                            register={register}
                            validations={{
                              required: "URL is required",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <Button theme="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding Link..." : "Add Link"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ModuleLinkModal;
