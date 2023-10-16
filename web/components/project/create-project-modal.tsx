import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// hooks
import useToast from "hooks/use-toast";
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";
import useWorkspaceMembers from "hooks/use-workspace-members";
// ui
import { CustomSelect, Icon, Avatar, CustomSearchSelect } from "components/ui";
import { Button, Input, TextArea } from "@plane/ui";
// components
import { ImagePickerPopover } from "components/core";
import EmojiIconPicker from "components/emoji-icon-picker";
// helpers
import { getRandomEmoji, renderEmoji } from "helpers/emoji.helper";
// types
import { IUser, IProject } from "types";
// constants
import { NETWORK_CHOICES } from "constants/project";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setToFavorite?: boolean;
  user: IUser | undefined;
};

const defaultValues: Partial<IProject> = {
  cover_image:
    "https://images.unsplash.com/photo-1531045535792-b515d59c3d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
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

export const CreateProjectModal: React.FC<Props> = (props) => {
  const { isOpen, setIsOpen, setToFavorite = false } = props;
  // store
  const { project: projectStore } = useMobxStore();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { memberDetails } = useWorkspaceMyMembership();
  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const {
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

  const handleClose = () => {
    setIsOpen(false);
    setIsChangeInIdentifierRequired(true);
    reset(defaultValues);
  };

  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    projectStore.addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { emoji_and_icon, ...payload } = formData;

    if (typeof formData.emoji_and_icon === "object") payload.icon_prop = formData.emoji_and_icon;
    else payload.emoji = formData.emoji_and_icon;

    await projectStore
      .createProject(workspaceSlug.toString(), payload)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Project created successfully.",
        });
        if (setToFavorite) {
          handleAddToFavorites(res.id);
        }
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

  const changeIdentifierOnNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isChangeInIdentifierRequired) return;

    if (e.target.value === "") setValue("identifier", "");
    else
      setValue(
        "identifier",
        e.target.value
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .substring(0, 5)
      );
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");

    setValue("identifier", alphanumericValue.toUpperCase());
    setIsChangeInIdentifierRequired(false);
  };

  const options = workspaceMembers?.map((member: any) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  if (memberDetails && isOpen) if (memberDetails.role <= 10) return <IsGuestCondition setIsOpen={setIsOpen} />;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
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
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="transform rounded-lg bg-custom-background-100 text-left shadow-xl transition-all p-3 w-full sm:w-3/5 lg:w-1/2 xl:w-2/5">
                <div className="group relative h-44 w-full rounded-lg bg-custom-background-80">
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
                  <div className="absolute bottom-2 right-2">
                    <ImagePickerPopover
                      label="Change Cover"
                      onChange={(image) => {
                        setValue("cover_image", image);
                      }}
                      control={control}
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
                              {value ? renderEmoji(value) : "Icon"}
                            </div>
                          }
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="divide-y-[0.5px] divide-custom-border-100 px-3">
                  <div className="mt-9 space-y-6 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-y-3 gap-x-2">
                      <div className="md:col-span-3">
                        <Controller
                          control={control}
                          name="name"
                          rules={{
                            required: "Title is required",
                            maxLength: {
                              value: 255,
                              message: "Title should be less than 255 characters",
                            },
                          }}
                          render={({ field: { value, ref } }) => (
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              value={value}
                              onChange={changeIdentifierOnNameChange}
                              ref={ref}
                              hasError={Boolean(errors.name)}
                              placeholder="Project Title"
                              className="w-full"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Controller
                          control={control}
                          name="identifier"
                          rules={{
                            required: "Identifier is required",
                            validate: (value) =>
                              /^[A-Z0-9]+$/.test(value.toUpperCase()) || "Identifier must be in uppercase.",
                            minLength: {
                              value: 1,
                              message: "Identifier must at least be of 1 character",
                            },
                            maxLength: {
                              value: 12,
                              message: "Identifier must at most be of 12 characters",
                            },
                          }}
                          render={({ field: { value, ref } }) => (
                            <Input
                              id="identifier"
                              name="identifier"
                              type="text"
                              value={value}
                              onChange={handleIdentifierChange}
                              ref={ref}
                              hasError={Boolean(errors.name)}
                              placeholder="Identifier"
                              className="text-sm w-full"
                            />
                          )}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Controller
                          name="description"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TextArea
                              id="description"
                              name="description"
                              value={value}
                              placeholder="Description..."
                              onChange={onChange}
                              className="text-sm !h-24"
                              hasError={Boolean(errors?.name)}
                            />
                          )}
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
                              buttonClassName="border-[0.5px] !px-2 shadow-md"
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
                            const selectedMember = workspaceMembers?.find((m: any) => m.member.id === value);

                            return (
                              <CustomSearchSelect
                                value={value}
                                onChange={onChange}
                                options={options}
                                buttonClassName="border-[0.5px] !px-2 shadow-md"
                                label={
                                  <div className="flex items-center justify-center gap-2 py-[1px]">
                                    {value ? (
                                      <>
                                        <Avatar user={selectedMember?.member} />
                                        <span>{selectedMember?.member.display_name} </span>
                                        <span onClick={() => onChange(null)}>
                                          <Icon
                                            iconName="close"
                                            className="!text-xs -mb-0.5 text-custom-text-200 hover:text-custom-text-100"
                                          />
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Icon iconName="group" className="!text-sm text-custom-text-400" />
                                        <span className="text-custom-text-400">Lead</span>
                                      </>
                                    )}
                                  </div>
                                }
                                noChevron
                              />
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-5">
                    <Button variant="neutral-primary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" size="sm" loading={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Project"}
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
