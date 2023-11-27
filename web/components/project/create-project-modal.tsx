import { useState, useEffect, Fragment, FC, ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// icons
import { X } from "lucide-react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import useToast from "hooks/use-toast";
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";
// ui
import { Button, CustomSelect, Input, TextArea } from "@plane/ui";
// components
import { WorkspaceMemberSelect } from "components/workspace";
import { ImagePickerPopover } from "components/core";
import EmojiIconPicker from "components/emoji-icon-picker";
// helpers
import { getRandomEmoji, renderEmoji } from "helpers/emoji.helper";
// types
import { IWorkspaceMember } from "types";
// constants
import { NETWORK_CHOICES, PROJECT_UNSPLASH_COVERS } from "constants/project";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
};

interface IIsGuestCondition {
  onClose: () => void;
}

const IsGuestCondition: FC<IIsGuestCondition> = ({ onClose }) => {
  const { setToastAlert } = useToast();

  useEffect(() => {
    onClose();
    setToastAlert({
      title: "Error",
      type: "error",
      message: "You don't have permission to create project.",
    });
  }, [onClose, setToastAlert]);

  return null;
};

export interface ICreateProjectForm {
  name: string;
  identifier: string;
  description: string;
  emoji_and_icon: string;
  network: number;
  project_lead_member: string;
  project_lead: string;
  cover_image: string;
  icon_prop: any;
  emoji: string;
}

export const CreateProjectModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug } = props;
  // store
  const {
    project: projectStore,
    workspaceMember: { workspaceMembers },
    trackEvent: { postHogEventTracker }
  } = useMobxStore();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  // toast
  const { setToastAlert } = useToast();
  // form info
  const cover_image = PROJECT_UNSPLASH_COVERS[Math.floor(Math.random() * PROJECT_UNSPLASH_COVERS.length)];
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
  } = useForm<ICreateProjectForm>({
    defaultValues: {
      cover_image,
      description: "",
      emoji_and_icon: getRandomEmoji(),
      identifier: "",
      name: "",
      network: 2,
      project_lead: undefined,
    },
    reValidateMode: "onChange",
  });

  const { memberDetails } = useWorkspaceMyMembership();

  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  if (memberDetails && isOpen) if (memberDetails.role <= 10) return <IsGuestCondition onClose={onClose} />;

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    reset();
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

  const onSubmit = async (formData: ICreateProjectForm) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { emoji_and_icon, project_lead_member, ...payload } = formData;

    if (typeof formData.emoji_and_icon === "object") payload.icon_prop = formData.emoji_and_icon;
    else payload.emoji = formData.emoji_and_icon;

    payload.project_lead = formData.project_lead_member;

    return projectStore
      .createProject(workspaceSlug.toString(), payload)
      .then((res) => {
        const newPayload = {
          ...res,
          state: "SUCCESS"
        }
        postHogEventTracker(
          "PROJECT_CREATE",
          newPayload,
        )
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
        Object.keys(err.data).map((key) => {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: err.data[key],
          });
          postHogEventTracker(
            "PROJECT_CREATE",
            {
              state: "FAILED"
            },
          )
        }
        );
      });
  };

  const handleNameChange = (onChange: any) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!isChangeInIdentifierRequired) {
      onChange(e);
      return;
    }
    if (e.target.value === "") setValue("identifier", "");
    else
      setValue(
        "identifier",
        e.target.value
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .substring(0, 5)
      );
    onChange(e);
  };

  const handleIdentifierChange = (onChange: any) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
    setIsChangeInIdentifierRequired(false);
    onChange(alphanumericValue.toUpperCase());
  };

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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="transform rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all p-3 w-full sm:w-3/5 lg:w-1/2 xl:w-2/5">
                <div className="group relative h-44 w-full rounded-lg bg-custom-background-80">
                  {watch("cover_image") !== null && (
                    <img
                      src={watch("cover_image")!}
                      className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                      alt="Cover Image"
                    />
                  )}

                  <div className="absolute right-2 top-2 p-2">
                    <button data-posthog="PROJECT_MODAL_CLOSE" type="button" onClick={handleClose}>
                      <X className="h-5 w-5 text-white" />
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
                          render={({ field: { value, onChange } }) => (
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              value={value}
                              tabIndex={1}
                              onChange={handleNameChange(onChange)}
                              hasError={Boolean(errors.name)}
                              placeholder="Project Title"
                              className="w-full focus:border-blue-400"
                            />
                          )}
                        />
                        <span className="text-xs text-red-500">{errors?.name?.message}</span>
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
                          render={({ field: { value, onChange } }) => (
                            <Input
                              id="identifier"
                              name="identifier"
                              type="text"
                              value={value}
                              tabIndex={2}
                              onChange={handleIdentifierChange(onChange)}
                              hasError={Boolean(errors.identifier)}
                              placeholder="Identifier"
                              className="text-xs w-full focus:border-blue-400"
                            />
                          )}
                        />
                        <span className="text-xs text-red-500">{errors?.identifier?.message}</span>
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
                              tabIndex={3}
                              placeholder="Description..."
                              onChange={onChange}
                              className="text-sm !h-24 focus:border-blue-400"
                              hasError={Boolean(errors?.description)}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex-shrink-0" tabIndex={4}>
                        <Controller
                          name="network"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <CustomSelect
                              value={value}
                              onChange={onChange}
                              buttonClassName="border-[0.5px] shadow-md !py-1.5 shadow-none"
                              label={
                                <div className="flex items-center gap-2 text-custom-text-300">
                                  {currentNetwork ? (
                                    <>
                                      <currentNetwork.icon className="h-[18px] w-[18px]" />
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
                                  <network.icon className="h-4 w-4" />
                                  {network.label}
                                </CustomSelect.Option>
                              ))}
                            </CustomSelect>
                          )}
                        />
                      </div>
                      <div className="flex-shrink-0" tabIndex={5}>
                        <Controller
                          name="project_lead_member"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <WorkspaceMemberSelect
                              value={workspaceMembers?.filter((member: IWorkspaceMember) => member.member.id === value)[0]}
                              onChange={onChange}
                              options={workspaceMembers || []}
                              placeholder="Select Lead"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-5">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={7}>
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
});
