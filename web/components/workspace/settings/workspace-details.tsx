import { useEffect, useState, FC } from "react";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { FileService } from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { DeleteWorkspaceModal } from "components/workspace";
import { WorkspaceImageUploadModal } from "components/core";
// ui
import { Button, CustomSelect, Input, Spinner } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IWorkspace } from "types";
// constants
import { EUserWorkspaceRoles, ORGANIZATION_SIZE } from "constants/workspace";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo: null,
};

// services
const fileService = new FileService();

export const WorkspaceDetails: FC = observer(() => {
  // states
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const [isImageRemoving, setIsImageRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  // store
  const {
    workspace: { currentWorkspace, updateWorkspace },
    user: { currentWorkspaceRole },
    trackEvent: { postHogEventTracker },
  } = useMobxStore();

  // hooks
  const { setToastAlert } = useToast();
  // form info
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...currentWorkspace },
  });

  const onSubmit = async (formData: IWorkspace) => {
    if (!currentWorkspace) return;

    const payload: Partial<IWorkspace> = {
      logo: formData.logo,
      name: formData.name,
      organization_size: formData.organization_size,
    };

    await updateWorkspace(currentWorkspace.slug, payload)
      .then((res) => {
        postHogEventTracker("WORKSPACE_UPDATE", {
          ...res,
          state: "SUCCESS",
        });
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => {
        postHogEventTracker("WORKSPACE_UPDATE", {
          state: "FAILED",
        });
        console.error(err);
      });
  };

  const handleRemoveLogo = () => {
    if (!currentWorkspace) return;

    const url = currentWorkspace.logo;

    if (!url) return;

    setIsImageRemoving(true);

    fileService.deleteFile(currentWorkspace.id, url).then(() => {
      updateWorkspace(currentWorkspace.slug, { logo: "" })
        .then(() => {
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Workspace picture removed successfully.",
          });
          setIsImageUploadModalOpen(false);
        })
        .catch(() => {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "There was some error in deleting your profile picture. Please try again.",
          });
        })
        .finally(() => setIsImageRemoving(false));
    });
  };

  const handleCopyUrl = () => {
    if (!currentWorkspace) return;

    copyUrlToClipboard(`${currentWorkspace.slug}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Workspace URL copied to the clipboard.",
      });
    });
  };

  useEffect(() => {
    if (currentWorkspace) reset({ ...currentWorkspace });
  }, [currentWorkspace, reset]);

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!currentWorkspace)
    return (
      <div className="grid place-items-center h-full w-full px-4 sm:px-0">
        <Spinner />
      </div>
    );

  return (
    <>
      <DeleteWorkspaceModal
        data={currentWorkspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <Controller
        control={control}
        name="logo"
        render={({ field: { onChange, value } }) => (
          <WorkspaceImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            isRemoving={isImageRemoving}
            handleRemove={handleRemoveLogo}
            onSuccess={(imageUrl) => {
              onChange(imageUrl);
              setIsImageUploadModalOpen(false);
              handleSubmit(onSubmit)();
            }}
            value={value}
          />
        )}
      />
      <div className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex gap-5 items-center pb-7 border-b border-custom-border-100">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => setIsImageUploadModalOpen(true)} disabled={!isAdmin}>
              {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                <div className="relative mx-auto flex h-14 w-14">
                  <img
                    src={watch("logo")!}
                    className="absolute top-0 left-0 h-full w-full object-cover rounded-md"
                    alt="Workspace Logo"
                  />
                </div>
              ) : (
                <div className="relative flex h-14 w-14 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                  {currentWorkspace?.name?.charAt(0) ?? "N"}
                </div>
              )}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold leading-6">{watch("name")}</h3>
            <button type="button" onClick={handleCopyUrl} className="text-sm tracking-tight">{`${
              typeof window !== "undefined" && window.location.origin.replace("http://", "").replace("https://", "")
            }/${currentWorkspace.slug}`}</button>
            {isAdmin && (
              <button
                className="flex items-center gap-1.5 text-xs text-left text-custom-primary-100 font-medium"
                onClick={() => setIsImageUploadModalOpen(true)}
              >
                {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                  <>
                    <Pencil className="h-3 w-3" />
                    Edit logo
                  </>
                ) : (
                  "Upload logo"
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8 my-10">
          <div className="grid grid-col grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 items-center justify-between gap-10 w-full">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm">Workspace name</h4>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Name is required",
                  maxLength: {
                    value: 80,
                    message: "Workspace name should not exceed 80 characters",
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.name)}
                    placeholder="Name"
                    className="rounded-md font-medium w-full"
                    disabled={!isAdmin}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">Company size</h4>
              <Controller
                name="organization_size"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    onChange={onChange}
                    label={ORGANIZATION_SIZE.find((c) => c === value) ?? "Select organization size"}
                    width="w-full"
                    buttonClassName="!border-[0.5px] !border-custom-border-200 !shadow-none"
                    input
                    disabled={!isAdmin}
                  >
                    {ORGANIZATION_SIZE.map((item) => (
                      <CustomSelect.Option key={item} value={item}>
                        {item}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>

            <div className="flex flex-col gap-1 ">
              <h4 className="text-sm">Workspace URL</h4>
              <Controller
                control={control}
                name="url"
                render={({ field: { onChange, ref } }) => (
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={`${
                      typeof window !== "undefined" &&
                      window.location.origin.replace("http://", "").replace("https://", "")
                    }/${currentWorkspace.slug}`}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.url)}
                    className="w-full"
                    disabled
                  />
                )}
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between py-2">
              <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Workspace"}
              </Button>
            </div>
          )}
        </div>
        {isAdmin && (
          <Disclosure as="div" className="border-t border-custom-border-100">
            {({ open }) => (
              <div className="w-full">
                <Disclosure.Button as="button" type="button" className="flex items-center justify-between w-full py-4">
                  <span className="text-lg tracking-tight">Delete Workspace</span>
                  {/* <Icon iconName={open ? "expand_less" : "expand_more"} className="!text-2xl" /> */}
                  {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Disclosure.Button>

                <Transition
                  show={open}
                  enter="transition duration-100 ease-out"
                  enterFrom="transform opacity-0"
                  enterTo="transform opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform opacity-100"
                  leaveTo="transform opacity-0"
                >
                  <Disclosure.Panel>
                    <div className="flex flex-col gap-8">
                      <span className="text-sm tracking-tight">
                        The danger zone of the workspace delete page is a critical area that requires careful
                        consideration and attention. When deleting a workspace, all of the data and resources within
                        that workspace will be permanently removed and cannot be recovered.
                      </span>
                      <div>
                        <Button variant="danger" onClick={() => setDeleteWorkspaceModal(true)}>
                          Delete my workspace
                        </Button>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </div>
            )}
          </Disclosure>
        )}
      </div>
    </>
  );
});
