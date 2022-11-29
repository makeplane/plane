import React, { useState, useEffect, useCallback } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// headless
import { Dialog, Transition } from "@headlessui/react";
// services
import projectServices from "lib/services/project.service";
// fetch keys
import { PROJECTS_LIST } from "constants/fetch-keys";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// ui
import { Button, Input, TextArea, Select } from "ui";
// common
import { debounce } from "constants/common";
// types
import { IProject } from "types";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const NETWORK_CHOICES = { "0": "Secret", "2": "Public" };

const defaultValues: Partial<IProject> = {
  name: "",
  description: "",
};

const CreateProjectModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const handleClose = () => {
    setIsOpen(false);
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const { activeWorkspace } = useUser();

  const { setToastAlert } = useToast();

  const [isChangeIdentifierRequired, setIsChangeIdentifierRequired] = useState(true);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
  } = useForm<IProject>({
    defaultValues,
  });

  const onSubmit = async (formData: IProject) => {
    if (!activeWorkspace) return;
    await projectServices
      .createProject(activeWorkspace.slug, formData)
      .then((res) => {
        console.log(res);
        mutate<IProject[]>(
          PROJECTS_LIST(activeWorkspace.slug),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Project created successfully",
        });
        handleClose();
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          const errorMessages = err[key];
          setError(key as keyof IProject, {
            message: Array.isArray(errorMessages) ? errorMessages.join(", ") : errorMessages,
          });
        });
      });
  };

  const projectName = watch("name") ?? "";
  const projectIdentifier = watch("identifier") ?? "";

  const checkIdentifier = (slug: string, value: string) => {
    projectServices.checkProjectIdentifierAvailability(slug, value).then((response) => {
      console.log(response);

      if (response.exists) setError("identifier", { message: "Identifier already exists" });
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkIdentifierAvailability = useCallback(debounce(checkIdentifier, 1500), []);

  useEffect(() => {
    if (projectName && isChangeIdentifierRequired) {
      setValue("identifier", projectName.replace(/ /g, "-").toUpperCase().substring(0, 3));
    }
  }, [projectName, projectIdentifier, setValue, isChangeIdentifierRequired]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Create Project
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Create a new project to start working on it.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Input
                          id="name"
                          label="Name"
                          name="name"
                          type="name"
                          placeholder="Enter name"
                          error={errors.name}
                          register={register}
                          validations={{
                            required: "Name is required",
                          }}
                        />
                      </div>
                      <div>
                        <Select
                          name="network"
                          id="network"
                          options={Object.keys(NETWORK_CHOICES).map((key) => ({
                            value: key,
                            label: NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES],
                          }))}
                          label="Network"
                          register={register}
                          validations={{
                            required: "Network is required",
                          }}
                        />
                      </div>
                      <div>
                        <TextArea
                          id="description"
                          name="description"
                          label="Description"
                          placeholder="Enter description"
                          error={errors.description}
                          register={register}
                        />
                      </div>
                      <div>
                        <Input
                          id="identifier"
                          label="Identifier"
                          name="identifier"
                          type="text"
                          placeholder="Enter Project Identifier"
                          error={errors.identifier}
                          register={register}
                          onChange={(e: any) => {
                            setIsChangeIdentifierRequired(false);
                            if (!activeWorkspace || !e.target.value) return;
                            checkIdentifierAvailability(activeWorkspace.slug, e.target.value);
                          }}
                          validations={{
                            required: "Identifier is required",
                            minLength: {
                              value: 1,
                              message: "Identifier must at least be of 1 character",
                            },
                            maxLength: {
                              value: 9,
                              message: "Identifier must at most be of 9 characters",
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <Button theme="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Project..." : "Create Project"}
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

export default CreateProjectModal;
