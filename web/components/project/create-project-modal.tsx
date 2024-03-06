import { useState, useEffect, Fragment, FC, ChangeEvent } from "react";
import { observer } from "mobx-react-lite";
import { useForm, Controller } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
// ui
import {
  Button,
  CustomEmojiIconPicker,
  CustomSelect,
  EmojiIconPickerTypes,
  Input,
  setToast,
  TextArea,
  TOAST_TYPE,
} from "@plane/ui";
// components
import { ImagePickerPopover } from "components/core";
import { MemberDropdown } from "components/dropdowns";
// constants
import { PROJECT_CREATED } from "constants/event-tracker";
import { NETWORK_CHOICES, PROJECT_UNSPLASH_COVERS } from "constants/project";
import { EUserWorkspaceRoles } from "constants/workspace";
// helpers
import { convertHexEmojiToDecimal, getRandomEmoji } from "helpers/emoji.helper";
// hooks
import { useEventTracker, useProject, useUser } from "hooks/store";
import { projectIdentifierSanitizer } from "helpers/project.helper";
import { ProjectLogo } from "./project-logo";
import { IProject } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
};

interface IIsGuestCondition {
  onClose: () => void;
}

const defaultValues: Partial<IProject> = {
  cover_image: PROJECT_UNSPLASH_COVERS[Math.floor(Math.random() * PROJECT_UNSPLASH_COVERS.length)],
  description: "",
  logo_props: {
    in_use: "emoji",
    emoji: {
      value: getRandomEmoji(),
    },
  },
  identifier: "",
  name: "",
  network: 2,
  project_lead: null,
};

const IsGuestCondition: FC<IIsGuestCondition> = ({ onClose }) => {
  useEffect(() => {
    onClose();
    setToast({
      title: "Error",
      type: TOAST_TYPE.ERROR,
      message: "You don't have permission to create project.",
    });
  }, [onClose]);

  return null;
};

export const CreateProjectModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug } = props;
  // store
  const { captureProjectEvent } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { addProjectToFavorites, createProject } = useProject();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  // form info
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

  if (currentWorkspaceRole && isOpen)
    if (currentWorkspaceRole < EUserWorkspaceRoles.MEMBER) return <IsGuestCondition onClose={onClose} />;

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const onSubmit = async (formData: Partial<IProject>) => {
    // Upper case identifier
    formData.identifier = formData.identifier?.toUpperCase();

    return createProject(workspaceSlug.toString(), formData)
      .then((res) => {
        const newPayload = {
          ...res,
          state: "SUCCESS",
        };
        captureProjectEvent({
          eventName: PROJECT_CREATED,
          payload: newPayload,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
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
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err.data[key],
          });
          captureProjectEvent({
            eventName: PROJECT_CREATED,
            payload: {
              ...formData,
              state: "FAILED",
            },
          });
        });
      });
  };

  const handleNameChange = (onChange: any) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!isChangeInIdentifierRequired) {
      onChange(e);
      return;
    }
    if (e.target.value === "") setValue("identifier", "");
    else setValue("identifier", projectIdentifierSanitizer(e.target.value).substring(0, 5));
    onChange(e);
  };

  const handleIdentifierChange = (onChange: any) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = projectIdentifierSanitizer(value);
    setIsChangeInIdentifierRequired(false);
    onChange(alphanumericValue);
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
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full transform rounded-lg bg-custom-background-100 p-3 text-left shadow-custom-shadow-md transition-all sm:w-3/5 lg:w-1/2 xl:w-2/5">
                <div className="group relative h-44 w-full rounded-lg bg-custom-background-80">
                  {watch("cover_image") && (
                    <img
                      src={watch("cover_image")!}
                      className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
                      alt="Cover image"
                    />
                  )}

                  <div className="absolute right-2 top-2 p-2">
                    <button data-posthog="PROJECT_MODAL_CLOSE" type="button" onClick={handleClose} tabIndex={8}>
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Controller
                      name="cover_image"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <ImagePickerPopover
                          label="Change Cover"
                          onChange={onChange}
                          control={control}
                          value={value}
                          tabIndex={9}
                        />
                      )}
                    />
                  </div>
                  <div className="absolute -bottom-[22px] left-3">
                    <Controller
                      name="logo_props"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <CustomEmojiIconPicker
                          label={
                            <span className="grid h-11 w-11 place-items-center rounded-md bg-custom-background-80">
                              <ProjectLogo logo={value} className="text-xl" />
                            </span>
                          }
                          onChange={(val: any) => {
                            let logoValue = {};

                            if (val.type === "emoji")
                              logoValue = {
                                value: convertHexEmojiToDecimal(val.value.unified),
                                url: val.value.imageUrl,
                              };
                            else if (val.type === "icon") logoValue = val.value;

                            onChange({
                              in_use: val.type,
                              [val.type]: logoValue,
                            });
                          }}
                          defaultIconColor={value.in_use === "icon" ? value.icon?.color : undefined}
                          defaultOpen={
                            value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                          }
                        />
                      )}
                    />
                  </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="divide-y-[0.5px] divide-custom-border-100 px-3">
                  <div className="mt-9 space-y-6 pb-5">
                    <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4">
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
                              onChange={handleNameChange(onChange)}
                              hasError={Boolean(errors.name)}
                              placeholder="Project Title"
                              className="w-full focus:border-blue-400"
                              tabIndex={1}
                            />
                          )}
                        />
                        <span className="text-xs text-red-500">
                          <>{errors?.name?.message}</>
                        </span>
                      </div>
                      <div>
                        <Controller
                          control={control}
                          name="identifier"
                          rules={{
                            required: "Identifier is required",
                            // allow only alphanumeric & non-latin characters
                            validate: (value) =>
                              /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) ||
                              "Only Alphanumeric & Non-latin characters are allowed.",
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
                              onChange={handleIdentifierChange(onChange)}
                              hasError={Boolean(errors.identifier)}
                              placeholder="Identifier"
                              className="w-full text-xs uppercase focus:border-blue-400"
                              tabIndex={2}
                            />
                          )}
                        />
                        <span className="text-xs text-red-500">
                          <>{errors?.identifier?.message}</>
                        </span>
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
                              className="!h-24 text-sm focus:border-blue-400"
                              hasError={Boolean(errors?.description)}
                              tabIndex={3}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Controller
                        name="network"
                        control={control}
                        render={({ field: { onChange, value } }) => {
                          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);

                          return (
                            <div className="flex-shrink-0" tabIndex={4}>
                              <CustomSelect
                                value={value}
                                onChange={onChange}
                                label={
                                  <div className="flex items-center gap-1">
                                    {currentNetwork ? (
                                      <>
                                        <currentNetwork.icon className="h-3 w-3" />
                                        {currentNetwork.label}
                                      </>
                                    ) : (
                                      <span className="text-custom-text-400">Select network</span>
                                    )}
                                  </div>
                                }
                                placement="bottom-start"
                                noChevron
                                tabIndex={4}
                              >
                                {NETWORK_CHOICES.map((network) => (
                                  <CustomSelect.Option key={network.key} value={network.key}>
                                    <div className="flex items-start gap-2">
                                      <network.icon className="h-3.5 w-3.5" />
                                      <div className="-mt-1">
                                        <p>{network.label}</p>
                                        <p className="text-xs text-custom-text-400">{network.description}</p>
                                      </div>
                                    </div>
                                  </CustomSelect.Option>
                                ))}
                              </CustomSelect>
                            </div>
                          );
                        }}
                      />
                      <Controller
                        name="project_lead"
                        control={control}
                        render={({ field: { value, onChange } }) => {
                          if (value === undefined || value === null || typeof value === "string")
                            return (
                              <div className="h-7 flex-shrink-0" tabIndex={5}>
                                <MemberDropdown
                                  value={value}
                                  onChange={onChange}
                                  placeholder="Lead"
                                  multiple={false}
                                  buttonVariant="border-with-text"
                                  tabIndex={5}
                                />
                              </div>
                            );
                          else return <></>;
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-5">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={7}>
                      {isSubmitting ? "Creating" : "Create project"}
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
