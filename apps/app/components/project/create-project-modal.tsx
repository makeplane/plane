import React, { useState, useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import projectServices from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";
import useWorkspaceMembers from "hooks/use-workspace-members";
// ui
import {
  Input,
  TextArea,
  CustomSelect,
  PrimaryButton,
  SecondaryButton,
  Icon,
  Avatar,
  CustomSearchSelect,
} from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// components
import { ImagePickerPopover } from "components/core";
import EmojiIconPicker from "components/emoji-icon-picker";
// helpers
import { getRandomEmoji, renderEmoji } from "helpers/emoji.helper";
// types
import { ICurrentUserResponse, IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";
// constants
import { NETWORK_CHOICES } from "constants/project";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: ICurrentUserResponse | undefined;
};

const defaultValues: Partial<IProject> = {
  cover_image:
    "https://images.unsplash.com/photo-1575116464504-9e7652fddcb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyODUyNTV8MHwxfHNlYXJjaHwxOHx8cGxhbmV8ZW58MHx8fHwxNjgxNDY4NTY5&ixlib=rb-4.0.3&q=80&w=1080",
  description: "",
  emoji_and_icon: getRandomEmoji(),
  identifier: "",
  name: "",
  network: 2,
  project_lead: null,
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

export const CreateProjectModal: React.FC<Props> = ({ isOpen, setIsOpen, user }) => {
  const [isChangeIdentifierRequired, setIsChangeIdentifierRequired] = useState(true);

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { memberDetails } = useWorkspaceMyMembership();
  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
  } = useForm<IProject>({
    defaultValues,
    reValidateMode: "onChange",
  });

  const projectName = watch("name");
  const projectIdentifier = watch("identifier");

  useEffect(() => {
    if (projectName && isChangeIdentifierRequired)
      setValue("identifier", projectName.replace(/ /g, "").toUpperCase().substring(0, 3));
  }, [projectName, projectIdentifier, setValue, isChangeIdentifierRequired]);

  useEffect(() => () => setIsChangeIdentifierRequired(true), [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    reset(defaultValues);
  };

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug) return;

    const { emoji_and_icon, ...payload } = formData;

    if (typeof formData.emoji_and_icon === "object") payload.icon_prop = formData.emoji_and_icon;
    else payload.emoji = formData.emoji_and_icon;

    await projectServices
      .createProject(workspaceSlug.toString(), payload, user)
      .then((res) => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug.toString(), { is_favorite: "all" }),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Project created successfully.",
        });
        handleClose();
      })
      .catch((err) => {
        Object.keys(err.data).map((key) =>
          setToastAlert({
            type: "error",
            title: "Error!",
            message: err.data[key],
          })
        );
      });
  };

  const options = workspaceMembers?.map((member) => ({
    value: member.member.id,
    query:
      (member.member.first_name && member.member.first_name !== ""
        ? member.member.first_name
        : member.member.email) +
        " " +
        member.member.last_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {`${
          member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name
            : member.member.email
        } ${member.member.last_name ?? ""}`}
      </div>
    ),
  }));

  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  if (memberDetails && isOpen)
    if (memberDetails.role <= 10) return <IsGuestCondition setIsOpen={setIsOpen} />;

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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="transform rounded-lg bg-custom-background-100 text-left shadow-xl transition-all p-3 w-full sm:w-3/5 lg:w-1/2 xl:w-2/5">
                <div className="group relative h-36 w-full rounded-lg bg-custom-background-80">
                  {watch("cover_image") !== null && (
                    <img
                      src={watch("cover_image")!}
                      className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                      alt="Cover Image"
                    />
                  )}

                  <div className="absolute right-2 top-2 p-2">
                    <button type="button" onClick={handleClose}>
                      <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="hidden group-hover:block absolute bottom-2 right-2">
                    <ImagePickerPopover
                      label="Change Cover"
                      onChange={(image) => {
                        setValue("cover_image", image);
                      }}
                      value={watch("cover_image")}
                    />
                  </div>
                  <div className="absolute -bottom-[22px] left-3">
                    <Controller
                      name="emoji_and_icon"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <EmojiIconPicker
                          label={
                            <div className="h-[44px] w-[44px] grid place-items-center rounded-md bg-custom-background-80 outline-none text-lg">
                              {value ? (
                                typeof value === "object" ? (
                                  <span
                                    style={{ color: value.color }}
                                    className="material-symbols-rounded text-lg"
                                  >
                                    {value.name}
                                  </span>
                                ) : (
                                  renderEmoji(value)
                                )
                              ) : (
                                "Icon"
                              )}
                            </div>
                          }
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>
                </div>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="divide-y-[0.5px] divide-custom-border-100 px-3"
                >
                  <div className="mt-9 space-y-6 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 gap-x-2">
                      <div className="md:col-span-3">
                        <Input
                          id="name"
                          name="name"
                          type="name"
                          placeholder="Project Title"
                          error={errors.name}
                          register={register}
                          validations={{
                            required: "Title is required",
                            maxLength: {
                              value: 255,
                              message: "Title should be less than 255 characters",
                            },
                          }}
                          autoComplete="off"
                          tabIndex={1}
                        />
                      </div>
                      <div>
                        <Input
                          id="identifier"
                          name="identifier"
                          type="text"
                          className="text-sm"
                          placeholder="Identifier"
                          error={errors.identifier}
                          register={register}
                          onChange={() => setIsChangeIdentifierRequired(false)}
                          validations={{
                            required: "Identifier is required",
                            validate: (value) =>
                              /^[A-Z]+$/.test(value) || "Identifier must be in uppercase.",
                            minLength: {
                              value: 1,
                              message: "Identifier must at least be of 1 character",
                            },
                            maxLength: {
                              value: 12,
                              message: "Identifier must at most be of 12 characters",
                            },
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <TextArea
                          id="description"
                          name="description"
                          className="text-sm !h-[8rem]"
                          placeholder="Description..."
                          error={errors.description}
                          register={register}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex-shrink-0">
                        <Controller
                          name="network"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <CustomSelect
                              value={value}
                              onChange={onChange}
                              label={
                                <div className="flex items-center gap-2 -mb-0.5 py-1">
                                  {currentNetwork ? (
                                    <>
                                      <Icon iconName={currentNetwork?.icon} className="!text-xs" />
                                      {currentNetwork.label}
                                    </>
                                  ) : (
                                    <span className="text-custom-text-400">Select Network</span>
                                  )}
                                </div>
                              }
                              noChevron
                            >
                              {NETWORK_CHOICES.map((network) => (
                                <CustomSelect.Option
                                  key={network.key}
                                  value={network.key}
                                  className="flex items-center gap-1"
                                >
                                  <Icon iconName={network.icon} className="!text-xs" />
                                  {network.label}
                                </CustomSelect.Option>
                              ))}
                            </CustomSelect>
                          )}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <Controller
                          name="project_lead"
                          control={control}
                          render={({ field: { value, onChange } }) => {
                            const selectedMember = workspaceMembers?.find(
                              (m) => m.member.id === value
                            );

                            return (
                              <CustomSearchSelect
                                value={value}
                                onChange={onChange}
                                options={options}
                                label={
                                  <div className="flex items-center justify-center gap-2 py-[1px]">
                                    {value ? (
                                      <>
                                        <Avatar user={selectedMember?.member} />
                                        <span>
                                          {selectedMember?.member.first_name}{" "}
                                          {selectedMember?.member.last_name}
                                        </span>
                                        <span onClick={() => onChange(null)}>
                                          <Icon
                                            iconName="close"
                                            className="!text-xs -mb-0.5 text-custom-text-200 hover:text-custom-text-100"
                                          />
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Icon
                                          iconName="group"
                                          className="!text-sm text-custom-text-400"
                                        />
                                        <span className="text-custom-text-400">Lead</span>
                                      </>
                                    )}
                                  </div>
                                }
                                verticalPosition="top"
                                noChevron
                              />
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-5">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit" size="sm" loading={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Project"}
                    </PrimaryButton>
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
