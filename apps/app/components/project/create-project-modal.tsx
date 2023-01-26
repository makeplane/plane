import React, { useState, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { useForm, Controller } from "react-hook-form";

import { Dialog, Transition } from "@headlessui/react";
// services
import projectServices from "services/project.service";
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input, TextArea, CustomSelect } from "components/ui";
// components
import EmojiIconPicker from "components/emoji-icon-picker";
// helpers
import { getRandomEmoji } from "helpers/functions.helper";
// types
import { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST, WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultValues: Partial<IProject> = {
  name: "",
  identifier: "",
  description: "",
  network: 2,
  icon: getRandomEmoji(),
};

const IsGuestCondition: React.FC<{
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setIsOpen }) => {
  const { setToastAlert } = useToast();

  useEffect(() => {
    setIsOpen(false);
    setToastAlert({
      title: "Error",
      type: "error",
      message: "You don't have permission to create project.",
    });
  }, [setIsOpen, setToastAlert]);

  return null;
};

export const CreateProjectModal: React.FC<Props> = (props) => {
  const { isOpen, setIsOpen } = props;

  const [isChangeIdentifierRequired, setIsChangeIdentifierRequired] = useState(true);

  const { setToastAlert } = useToast();

  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: myWorkspaceMembership } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug as string) : null,
    {
      shouldRetryOnError: false,
    }
  );

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    setValue,
  } = useForm<IProject>({
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const projectName = watch("name") ?? "";
  const projectIdentifier = watch("identifier") ?? "";

  useEffect(() => {
    if (projectName && isChangeIdentifierRequired) {
      setValue("identifier", projectName.replace(/ /g, "").toUpperCase().substring(0, 3));
    }
  }, [projectName, projectIdentifier, setValue, isChangeIdentifierRequired]);

  useEffect(() => () => setIsChangeIdentifierRequired(true), [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug) return;
    await projectServices
      .createProject(workspaceSlug as string, formData)
      .then((res) => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
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
        if (err.status === 403) {
          setToastAlert({
            title: "Error",
            type: "error",
            message: "You don't have permission to create project.",
          });
          handleClose();
          return;
        }
        err = err.data;
        Object.keys(err).map((key) => {
          const errorMessages = err[key];
          setError(key as keyof IProject, {
            message: Array.isArray(errorMessages) ? errorMessages.join(", ") : errorMessages,
          });
        });
      });
  };

  // FIXME: remove this and authorize using getServerSideProps
  if (myWorkspaceMembership && isOpen) {
    if (myWorkspaceMembership.role <= 10) return <IsGuestCondition setIsOpen={setIsOpen} />;
  }

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <label htmlFor="icon" className="mb-2 text-gray-500">
                            Icon
                          </label>
                          <Controller
                            control={control}
                            name="icon"
                            render={({ field: { value, onChange } }) => (
                              <EmojiIconPicker
                                label={
                                  value ? String.fromCodePoint(parseInt(value)) : "Select Icon"
                                }
                                value={value}
                                onChange={onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="w-full">
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
                      </div>
                      <div>
                        <h6 className="text-gray-500">Network</h6>
                        <Controller
                          name="network"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <CustomSelect
                              value={value}
                              onChange={onChange}
                              label={
                                Object.keys(NETWORK_CHOICES).find((k) => k === value.toString())
                                  ? NETWORK_CHOICES[
                                      value.toString() as keyof typeof NETWORK_CHOICES
                                    ]
                                  : "Select network"
                              }
                              input
                            >
                              {Object.keys(NETWORK_CHOICES).map((key) => (
                                <CustomSelect.Option key={key} value={key}>
                                  {NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES]}
                                </CustomSelect.Option>
                              ))}
                            </CustomSelect>
                          )}
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
                          onChange={() => setIsChangeIdentifierRequired(false)}
                          validations={{
                            required: "Identifier is required",
                            validate: (value) =>
                              /^[A-Z]+$/.test(value) || "Identifier must be uppercase text.",
                            minLength: {
                              value: 1,
                              message: "Identifier must at least be of 1 character",
                            },
                            maxLength: {
                              value: 5,
                              message: "Identifier must at most be of 5 characters",
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
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
