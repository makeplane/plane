import { useState, FC, ChangeEvent } from "react";
import { observer } from "mobx-react-lite";
import { useForm, Controller } from "react-hook-form";
import { Info, X } from "lucide-react";
import { IProject } from "@plane/types";
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
  Tooltip,
} from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ImagePickerPopover } from "@/components/core";
import { MemberDropdown } from "@/components/dropdowns";
// constants
import { PROJECT_CREATED } from "@/constants/event-tracker";
import { NETWORK_CHOICES, PROJECT_UNSPLASH_COVERS } from "@/constants/project";
// helpers
import { cn } from "@/helpers/common.helper";
import { convertHexEmojiToDecimal, getRandomEmoji } from "@/helpers/emoji.helper";
import { projectIdentifierSanitizer } from "@/helpers/project.helper";
// hooks
import { useEventTracker, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
};

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

export const CreateProjectForm: FC<Props> = observer((props) => {
  const { setToFavorite, workspaceSlug, onClose, handleNextStep } = props;
  // store
  const { captureProjectEvent } = useEventTracker();
  const { addProjectToFavorites, createProject } = useProject();
  // states
  const [isOpen, setIsOpen] = useState(false);
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
  const { isMobile } = usePlatformOS();
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
        handleNextStep(res.id);
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

  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  return (
    <>
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
                isOpen={isOpen}
                handleToggle={(val: boolean) => setIsOpen(val)}
                className="flex items-center justify-center"
                buttonClassName="flex items-center justify-center"
                label={
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-custom-background-80">
                    <Logo logo={value} size={20} />
                  </span>
                }
                onChange={(val: any) => {
                  let logoValue = {};

                  if (val?.type === "emoji")
                    logoValue = {
                      value: convertHexEmojiToDecimal(val.value.unified),
                      url: val.value.imageUrl,
                    };
                  else if (val?.type === "icon") logoValue = val.value;

                  onChange({
                    in_use: val?.type,
                    [val?.type]: logoValue,
                  });
                  setIsOpen(false);
                }}
                defaultIconColor={value.in_use && value.in_use === "icon" ? value.icon?.color : undefined}
                defaultOpen={
                  value.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                }
              />
            )}
          />
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-9 space-y-6 pb-5">
          <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4">
            <div className="md:col-span-3">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Name is required",
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
                    placeholder="Project name"
                    className="w-full focus:border-blue-400"
                    tabIndex={1}
                  />
                )}
              />
              <span className="text-xs text-red-500">
                <>{errors?.name?.message}</>
              </span>
            </div>
            <div className="relative">
              <Controller
                control={control}
                name="identifier"
                rules={{
                  required: "Project ID is required",
                  // allow only alphanumeric & non-latin characters
                  validate: (value) =>
                    /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) ||
                    "Only Alphanumeric & Non-latin characters are allowed.",
                  minLength: {
                    value: 1,
                    message: "Project ID must at least be of 1 character",
                  },
                  maxLength: {
                    value: 5,
                    message: "Project ID must at most be of 5 characters",
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
                    placeholder="Project ID"
                    className={cn("w-full text-xs focus:border-blue-400 pr-7", {
                      uppercase: value,
                    })}
                    tabIndex={2}
                  />
                )}
              />
              <Tooltip
                isMobile={isMobile}
                tooltipContent="Helps you identify issues in the project uniquely, (e.g. APP-123). Max 5 characters."
                className="text-sm"
                position="right-top"
              >
                <Info className="absolute right-2 top-2.5 h-3 w-3 text-custom-text-400" />
              </Tooltip>
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
                    <div className="flex-shrink-0" tabIndex={5}>
                      <MemberDropdown
                        value={value}
                        onChange={(lead) => onChange(lead === value ? null : lead)}
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

        <div className="flex justify-end gap-2 pt-4 border-t border-custom-border-100">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={7}>
            {isSubmitting ? "Creating" : "Create project"}
          </Button>
        </div>
      </form>
    </>
  );
});
