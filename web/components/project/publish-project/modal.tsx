import React, { useEffect, useState } from "react";
// next imports
import { useRouter } from "next/router";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui components
import getConfig from "next/config";
import {
  ToggleSwitch,
  PrimaryButton,
  SecondaryButton,
  Icon,
  DangerButton,
  Loader,
} from "components/ui";
import { CustomPopover } from "./popover";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { IProjectPublishSettings, TProjectPublishViews } from "store/project-publish";
// hooks
import useToast from "hooks/use-toast";
import useProjectDetails from "hooks/use-project-details";
import useUser from "hooks/use-user";

type Props = {
  // user: ICurrentUserResponse | undefined;
};

type FormData = {
  id: string | null;
  comments: boolean;
  reactions: boolean;
  votes: boolean;
  inbox: string | null;
  views: TProjectPublishViews[];
};

const defaultValues: FormData = {
  id: null,
  comments: false,
  reactions: false,
  votes: false,
  inbox: null,
  views: ["list", "kanban"],
};

const viewOptions: {
  key: TProjectPublishViews;
  label: string;
}[] = [
  { key: "list", label: "List" },
  { key: "kanban", label: "Kanban" },
  // { key: "calendar", label: "Calendar" },
  // { key: "gantt", label: "Gantt" },
  // { key: "spreadsheet", label: "Spreadsheet" },
];

export const PublishProjectModal: React.FC<Props> = observer(() => {
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);

  const { publicRuntimeConfig: { NEXT_PUBLIC_DEPLOY_URL } } = getConfig();

  const plane_deploy_url = NEXT_PUBLIC_DEPLOY_URL ?? "http://localhost:4000";

  const router = useRouter()
  const { workspaceSlug } = router.query;

  const store: RootStore = useMobxStore();
  const { projectPublish } = store;

  const { user } = useUser();

  const { mutateProjectDetails } = useProjectDetails();

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { isSubmitting },
    getValues,
    handleSubmit,
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues,
  });

  const handleClose = () => {
    projectPublish.handleProjectModal(null);

    setIsUpdateRequired(false);
    reset({ ...defaultValues });
  };

  // prefill form with the saved settings if the project is already published
  useEffect(() => {
    if (
      projectPublish.projectPublishSettings &&
      projectPublish.projectPublishSettings !== "not-initialized"
    ) {
      let userBoards: TProjectPublishViews[] = [];

      if (projectPublish.projectPublishSettings?.views) {
        const savedViews = projectPublish.projectPublishSettings?.views;

        if (!savedViews) return;

        if (savedViews.list) userBoards.push("list");
        if (savedViews.kanban) userBoards.push("kanban");
        if (savedViews.calendar) userBoards.push("calendar");
        if (savedViews.gantt) userBoards.push("gantt");
        if (savedViews.spreadsheet) userBoards.push("spreadsheet");

        userBoards = userBoards && userBoards.length > 0 ? userBoards : ["list"];
      }

      const updatedData = {
        id: projectPublish.projectPublishSettings?.id || null,
        comments: projectPublish.projectPublishSettings?.comments || false,
        reactions: projectPublish.projectPublishSettings?.reactions || false,
        votes: projectPublish.projectPublishSettings?.votes || false,
        inbox: projectPublish.projectPublishSettings?.inbox || null,
        views: userBoards,
      };

      reset({ ...updatedData });
    }
  }, [reset, projectPublish.projectPublishSettings]);

  // fetch publish settings
  useEffect(() => {
    if (!workspaceSlug) return;

    if (
      projectPublish.projectPublishModal &&
      projectPublish.project_id !== null &&
      projectPublish?.projectPublishSettings === "not-initialized"
    ) {
      projectPublish.getProjectSettingsAsync(
        workspaceSlug.toString(),
        projectPublish.project_id,
        null
      );
    }
  }, [workspaceSlug, projectPublish, projectPublish.projectPublishModal]);

  const handlePublishProject = async (payload: IProjectPublishSettings) => {
    if (!workspaceSlug || !user) return;

    const projectId = projectPublish.project_id;

    return projectPublish
      .publishProject(workspaceSlug.toString(), projectId?.toString() ?? "", payload, user)
      .then((res) => {
        mutateProjectDetails();
        handleClose();
        if (projectId) window.open(`${plane_deploy_url}/${workspaceSlug}/${projectId}`, "_blank");
        return res;
      })
      .catch((err) => err);
  };

  const handleUpdatePublishSettings = async (payload: IProjectPublishSettings) => {
    if (!workspaceSlug || !user) return;

    await projectPublish
      .updateProjectSettingsAsync(
        workspaceSlug.toString(),
        projectPublish.project_id?.toString() ?? "",
        payload.id ?? "",
        payload,
        user
      )
      .then((res) => {
        mutateProjectDetails();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Publish settings updated successfully!",
        });

        handleClose();
        return res;
      })
      .catch((error) => {
        console.log("error", error);
        return error;
      });
  };

  const handleUnpublishProject = async (publishId: string) => {
    if (!workspaceSlug || !publishId) return;

    setIsUnpublishing(true);

    projectPublish
      .unPublishProject(
        workspaceSlug.toString(),
        projectPublish.project_id as string,
        publishId,
        null
      )
      .then((res) => {
        mutateProjectDetails();

        handleClose();
        return res;
      })
      .catch((err) => err)
      .finally(() => setIsUnpublishing(false));
  };

  const CopyLinkToClipboard = ({ copy_link }: { copy_link: string }) => {
    const [status, setStatus] = useState(false);

    const copyText = () => {
      navigator.clipboard.writeText(copy_link);
      setStatus(true);
      setTimeout(() => {
        setStatus(false);
      }, 1000);
    };

    return (
      <div
        className="border border-custom-border-100 bg-custom-background-100 text-xs px-2 min-w-[30px] h-[30px] rounded flex justify-center items-center hover:bg-custom-background-90 cursor-pointer"
        onClick={() => copyText()}
      >
        {status ? "Copied" : "Copy Link"}
      </div>
    );
  };

  const handleFormSubmit = async (formData: FormData) => {
    if (!formData.views || formData.views.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one view layout to publish the project.",
      });
      return;
    }

    const payload = {
      comments: formData.comments,
      reactions: formData.reactions,
      votes: formData.votes,
      inbox: formData.inbox,
      views: {
        list: formData.views.includes("list"),
        kanban: formData.views.includes("kanban"),
        calendar: formData.views.includes("calendar"),
        gantt: formData.views.includes("gantt"),
        spreadsheet: formData.views.includes("spreadsheet"),
      },
    };

    if (watch("id")) await handleUpdatePublishSettings({ id: watch("id") ?? "", ...payload });
    else await handlePublishProject(payload);
  };

  // check if an update is required or not
  const checkIfUpdateIsRequired = () => {
    if (
      !projectPublish.projectPublishSettings ||
      projectPublish.projectPublishSettings === "not-initialized"
    )
      return;

    const currentSettings = projectPublish.projectPublishSettings as IProjectPublishSettings;
    const newSettings = getValues();

    if (
      currentSettings.comments !== newSettings.comments ||
      currentSettings.reactions !== newSettings.reactions ||
      currentSettings.votes !== newSettings.votes
    ) {
      setIsUpdateRequired(true);
      return;
    }

    let viewCheckFlag = 0;
    viewOptions.forEach((option) => {
      if (currentSettings.views[option.key] !== newSettings.views.includes(option.key))
        viewCheckFlag++;
    });

    if (viewCheckFlag !== 0) {
      setIsUpdateRequired(true);
      return;
    }

    setIsUpdateRequired(false);
  };

  return (
    <Transition.Root show={projectPublish.projectPublishModal} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="transform rounded-lg bg-custom-background-100 border border-custom-border-100 text-left shadow-xl transition-all w-full sm:w-3/5 lg:w-1/2 xl:w-2/5 ">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  {/* heading */}
                  <div className="px-6 pt-4 flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-xl inline-block">Publish</h5>
                    {projectPublish.projectPublishSettings !== "not-initialized" && (
                      <DangerButton
                        onClick={() => handleUnpublishProject(watch("id") ?? "")}
                        className="!px-2 !py-1.5"
                        loading={isUnpublishing}
                      >
                        {isUnpublishing ? "Unpublishing..." : "Unpublish"}
                      </DangerButton>
                    )}
                  </div>

                  {/* content */}
                  {projectPublish.fetchSettingsLoader ? (
                    <Loader className="px-6 space-y-4">
                      <Loader.Item height="30px" />
                      <Loader.Item height="30px" />
                      <Loader.Item height="30px" />
                      <Loader.Item height="30px" />
                    </Loader>
                  ) : (
                    <div className="px-6">
                      {watch("id") && (
                        <>
                          <div className="border border-custom-border-100 bg-custom-background-80 rounded-md px-3 py-2 relative flex gap-2 items-center">
                            <div className="truncate flex-grow text-sm">
                              {`${plane_deploy_url}/${workspaceSlug}/${projectPublish.project_id}`}
                            </div>
                            <div className="flex-shrink-0 relative flex items-center gap-1">
                              <CopyLinkToClipboard
                                copy_link={`${plane_deploy_url}/${workspaceSlug}/${projectPublish.project_id}`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-custom-primary-100 mt-3">
                            <div className="w-5 h-5 overflow-hidden flex items-center">
                              <Icon iconName="radio_button_checked" className="!text-lg" />
                            </div>
                            <div className="text-sm">This project is live on web</div>
                          </div>
                        </>
                      )}

                      <div className="space-y-4 mt-6">
                        <div className="relative flex justify-between items-center gap-2">
                          <div className="text-sm">Views</div>
                          <Controller
                            control={control}
                            name="views"
                            render={({ field: { onChange, value } }) => (
                              <CustomPopover
                                label={
                                  value.length > 0
                                    ? viewOptions
                                        .filter((v) => value.includes(v.key))
                                        .map((v) => v.label)
                                        .join(", ")
                                    : ``
                                }
                                placeholder="Select views"
                              >
                                <>
                                  {viewOptions.map((option) => (
                                    <div
                                      key={option.key}
                                      className={`relative flex items-center gap-2 justify-between p-1 m-1 px-2 cursor-pointer rounded-sm text-custom-text-200 ${
                                        value.includes(option.key)
                                          ? "bg-custom-background-80 text-custom-text-100"
                                          : "hover:bg-custom-background-80 hover:text-custom-text-100"
                                      }`}
                                      onClick={() => {
                                        const _views =
                                          value.length > 0
                                            ? value.includes(option.key)
                                              ? value.filter((_o: string) => _o !== option.key)
                                              : [...value, option.key]
                                            : [option.key];

                                        if (_views.length === 0) return;

                                        onChange(_views);
                                        checkIfUpdateIsRequired();
                                      }}
                                    >
                                      <div className="text-sm">{option.label}</div>
                                      <div
                                        className={`w-[18px] h-[18px] relative flex justify-center items-center`}
                                      >
                                        {value.length > 0 && value.includes(option.key) && (
                                          <Icon iconName="done" className="!text-lg" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </>
                              </CustomPopover>
                            )}
                          />
                        </div>
                        <div className="relative flex justify-between items-center gap-2">
                          <div className="text-sm">Allow comments</div>
                          <Controller
                            control={control}
                            name="comments"
                            render={({ field: { onChange, value } }) => (
                              <ToggleSwitch
                                value={value}
                                onChange={(val) => {
                                  onChange(val);
                                  checkIfUpdateIsRequired();
                                }}
                                size="sm"
                              />
                            )}
                          />
                        </div>
                        <div className="relative flex justify-between items-center gap-2">
                          <div className="text-sm">Allow reactions</div>
                          <Controller
                            control={control}
                            name="reactions"
                            render={({ field: { onChange, value } }) => (
                              <ToggleSwitch
                                value={value}
                                onChange={(val) => {
                                  onChange(val);
                                  checkIfUpdateIsRequired();
                                }}
                                size="sm"
                              />
                            )}
                          />
                        </div>
                        <div className="relative flex justify-between items-center gap-2">
                          <div className="text-sm">Allow voting</div>
                          <Controller
                            control={control}
                            name="votes"
                            render={({ field: { onChange, value } }) => (
                              <ToggleSwitch
                                value={value}
                                onChange={(val) => {
                                  onChange(val);
                                  checkIfUpdateIsRequired();
                                }}
                                size="sm"
                              />
                            )}
                          />
                        </div>

                        {/* <div className="relative flex justify-between items-center gap-2">
                      <div className="text-sm">Allow issue proposals</div>
                      <Controller
                        control={control}
                        name="inbox"
                        render={({ field: { onChange, value } }) => (
                          <ToggleSwitch value={value} onChange={onChange} size="sm" />
                        )}
                      />
                    </div> */}
                      </div>
                    </div>
                  )}

                  {/* modal handlers */}
                  <div className="border-t border-custom-border-200 px-6 py-5 relative flex justify-between items-center">
                    <div className="flex items-center gap-1 text-custom-text-400 text-sm">
                      <Icon iconName="public" className="!text-base" />
                      <div className="text-sm">Anyone with the link can access</div>
                    </div>
                    {!projectPublish.fetchSettingsLoader && (
                      <div className="relative flex items-center gap-2">
                        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                        {watch("id") ? (
                          <>
                            {isUpdateRequired && (
                              <PrimaryButton type="submit" loading={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update settings"}
                              </PrimaryButton>
                            )}
                          </>
                        ) : (
                          <PrimaryButton type="submit" loading={isSubmitting}>
                            {isSubmitting ? "Publishing..." : "Publish"}
                          </PrimaryButton>
                        )}
                      </div>
                    )}
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
