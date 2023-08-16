import React, { useEffect } from "react";
// next imports
import { useRouter } from "next/router";
// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui components
import { ToggleSwitch, PrimaryButton, SecondaryButton } from "components/ui";
import { CustomPopover } from "./popover";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { IProjectPublishSettingsViews } from "store/project-publish";

type Props = {
  // user: ICurrentUserResponse | undefined;
};

const defaultValues: Partial<any> = {
  id: null,
  comments: false,
  reactions: false,
  votes: false,
  inbox: null,
  views: [],
};

const viewOptions = [
  { key: "list", value: "List" },
  { key: "kanban", value: "Kanban" },
  // { key: "calendar", value: "Calendar" },
  // { key: "gantt", value: "Gantt" },
  // { key: "spreadsheet", value: "Spreadsheet" },
];

export const PublishProjectModal: React.FC<Props> = observer(() => {
  const store: RootStore = useMobxStore();
  const { projectPublish } = store;

  const { NEXT_PUBLIC_DEPLOY_URL } = process.env;
  const plane_deploy_url = NEXT_PUBLIC_DEPLOY_URL
    ? NEXT_PUBLIC_DEPLOY_URL
    : "http://localhost:3001";

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<any>({
    defaultValues,
    reValidateMode: "onChange",
  });

  const handleClose = () => {
    projectPublish.handleProjectModal(null);
    reset({ ...defaultValues });
  };

  useEffect(() => {
    if (
      projectPublish.projectPublishSettings &&
      projectPublish.projectPublishSettings != "not-initialized"
    ) {
      let userBoards: string[] = [];
      if (projectPublish.projectPublishSettings?.views) {
        const _views: IProjectPublishSettingsViews | null =
          projectPublish.projectPublishSettings?.views || null;
        if (_views != null) {
          if (_views.list) userBoards.push("list");
          if (_views.kanban) userBoards.push("kanban");
          if (_views.calendar) userBoards.push("calendar");
          if (_views.gantt) userBoards.push("gantt");
          if (_views.spreadsheet) userBoards.push("spreadsheet");
          userBoards = userBoards && userBoards.length > 0 ? userBoards : ["list"];
        }
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

  useEffect(() => {
    if (
      projectPublish.projectPublishModal &&
      workspaceSlug &&
      projectPublish.project_id != null &&
      projectPublish?.projectPublishSettings === "not-initialized"
    ) {
      projectPublish.getProjectSettingsAsync(
        workspaceSlug as string,
        projectPublish.project_id as string,
        null
      );
    }
  }, [workspaceSlug, projectPublish, projectPublish.projectPublishModal]);

  const onSettingsPublish = async (formData: any) => {
    const payload = {
      comments: formData.comments || false,
      reactions: formData.reactions || false,
      votes: formData.votes || false,
      inbox: formData.inbox || null,
      views: {
        list: formData.views.includes("list") || false,
        kanban: formData.views.includes("kanban") || false,
        calendar: formData.views.includes("calendar") || false,
        gantt: formData.views.includes("gantt") || false,
        spreadsheet: formData.views.includes("spreadsheet") || false,
      },
    };

    return projectPublish
      .createProjectSettingsAsync(
        workspaceSlug as string,
        projectPublish.project_id as string,
        payload,
        null
      )
      .then((response) => response)
      .catch((error) => {
        console.error("error", error);
        return error;
      });
  };

  const onSettingsUpdate = async (key: string, value: any) => {
    const payload = {
      comments: key === "comments" ? value : watch("comments"),
      reactions: key === "reactions" ? value : watch("reactions"),
      votes: key === "votes" ? value : watch("votes"),
      inbox: key === "inbox" ? value : watch("inbox"),
      views:
        key === "views"
          ? {
              list: value.includes("list") ? true : false,
              kanban: value.includes("kanban") ? true : false,
              calendar: value.includes("calendar") ? true : false,
              gantt: value.includes("gantt") ? true : false,
              spreadsheet: value.includes("spreadsheet") ? true : false,
            }
          : {
              list: watch("views").includes("list") ? true : false,
              kanban: watch("views").includes("kanban") ? true : false,
              calendar: watch("views").includes("calendar") ? true : false,
              gantt: watch("views").includes("gantt") ? true : false,
              spreadsheet: watch("views").includes("spreadsheet") ? true : false,
            },
    };

    return projectPublish
      .updateProjectSettingsAsync(
        workspaceSlug as string,
        projectPublish.project_id as string,
        watch("id"),
        payload,
        null
      )
      .then((response) => response)
      .catch((error) => {
        console.log("error", error);
        return error;
      });
  };

  const onSettingsUnPublish = async (formData: any) =>
    projectPublish
      .deleteProjectSettingsAsync(
        workspaceSlug as string,
        projectPublish.project_id as string,
        formData?.id,
        null
      )
      .then((response) => {
        reset({ ...defaultValues });
        return response;
      })
      .catch((error) => {
        console.error("error", error);
        return error;
      });

  const CopyLinkToClipboard = ({ copy_link }: { copy_link: string }) => {
    const [status, setStatus] = React.useState(false);

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
              <Dialog.Panel className="transform rounded-lg bg-custom-background-100 border border-custom-border-100 text-left shadow-xl transition-all w-full sm:w-3/5 lg:w-1/2 xl:w-2/5 space-y-4">
                {/* heading */}
                <div className="p-3 px-4 pb-0 flex gap-2 justify-between items-center">
                  <div className="font-medium text-xl">Publish</div>
                  {projectPublish.loader && (
                    <div className="text-xs text-custom-text-400">Changes saved</div>
                  )}
                  <div
                    className="hover:bg-custom-background-90 w-[30px] h-[30px] rounded flex justify-center items-center cursor-pointer transition-all"
                    onClick={handleClose}
                  >
                    <span className="material-symbols-rounded text-[16px]">close</span>
                  </div>
                </div>

                {/* content */}
                <div className="space-y-3">
                  {watch("id") && (
                    <div className="flex items-center gap-1 px-4 text-custom-primary-100">
                      <div className="w-[20px] h-[20px] overflow-hidden flex items-center">
                        <span className="material-symbols-rounded text-[18px]">
                          radio_button_checked
                        </span>
                      </div>
                      <div className="text-sm">This project is live on web</div>
                    </div>
                  )}

                  <div className="mx-4 border border-custom-border-100 bg-custom-background-90 rounded p-3 py-2 relative flex gap-2 items-center">
                    <div className="relative line-clamp-1 overflow-hidden w-full text-sm">
                      {`${plane_deploy_url}/${workspaceSlug}/${projectPublish.project_id}`}
                    </div>
                    <div className="flex-shrink-0 relative flex items-center gap-1">
                      <a
                        href={`${plane_deploy_url}/${workspaceSlug}/${projectPublish.project_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="border border-custom-border-100 bg-custom-background-100 w-[30px] h-[30px] rounded flex justify-center items-center hover:bg-custom-background-90 cursor-pointer">
                          <span className="material-symbols-rounded text-[16px]">open_in_new</span>
                        </div>
                      </a>
                      <CopyLinkToClipboard
                        copy_link={`${plane_deploy_url}/${workspaceSlug}/${projectPublish.project_id}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 px-4">
                    <div className="relative flex justify-between items-center gap-2">
                      <div className="text-custom-text-100">Views</div>
                      <div>
                        <CustomPopover
                          label={
                            watch("views") && watch("views").length > 0
                              ? viewOptions
                                  .filter(
                                    (_view) => watch("views").includes(_view.key) && _view.value
                                  )
                                  .map((_view) => _view.value)
                                  .join(", ")
                              : ``
                          }
                          placeholder="Select views"
                        >
                          <>
                            {viewOptions &&
                              viewOptions.length > 0 &&
                              viewOptions.map((_view) => (
                                <div
                                  key={_view.value}
                                  className={`relative flex items-center gap-2 justify-between p-1 m-1 px-2 cursor-pointer rounded-sm text-custom-text-200 ${
                                    watch("views").includes(_view.key)
                                      ? `bg-custom-background-80 text-custom-text-100`
                                      : `hover:bg-custom-background-80 hover:text-custom-text-100`
                                  }`}
                                  onClick={() => {
                                    const _views =
                                      watch("views") && watch("views").length > 0
                                        ? watch("views").includes(_view?.key)
                                          ? watch("views").filter((_o: string) => _o !== _view?.key)
                                          : [...watch("views"), _view?.key]
                                        : [_view?.key];
                                    setValue("views", _views);
                                    if (watch("id") != null) onSettingsUpdate("views", _views);
                                  }}
                                >
                                  <div className="text-sm">{_view.value}</div>
                                  <div
                                    className={`w-[18px] h-[18px] relative flex justify-center items-center`}
                                  >
                                    {watch("views") &&
                                      watch("views").length > 0 &&
                                      watch("views").includes(_view.key) && (
                                        <span className="material-symbols-rounded text-[18px]">
                                          done
                                        </span>
                                      )}
                                  </div>
                                </div>
                              ))}
                          </>
                        </CustomPopover>
                      </div>
                    </div>

                    {/* <div className="relative flex justify-between items-center gap-2">
                      <div className="text-custom-text-100">Allow comments</div>
                      <div>
                        <ToggleSwitch
                          value={watch("comments") ?? false}
                          onChange={() => {
                            const _comments = !watch("comments");
                            setValue("comments", _comments);
                            if (watch("id") != null) onSettingsUpdate("comments", _comments);
                          }}
                          size="sm"
                        />
                      </div>
                    </div> */}

                    {/* <div className="relative flex justify-between items-center gap-2">
                      <div className="text-custom-text-100">Allow reactions</div>
                      <div>
                        <ToggleSwitch
                          value={watch("reactions") ?? false}
                          onChange={() => {
                            const _reactions = !watch("reactions");
                            setValue("reactions", _reactions);
                            if (watch("id") != null) onSettingsUpdate("reactions", _reactions);
                          }}
                          size="sm"
                        />
                      </div>
                    </div> */}

                    {/* <div className="relative flex justify-between items-center gap-2">
                      <div className="text-custom-text-100">Allow Voting</div>
                      <div>
                        <ToggleSwitch
                          value={watch("votes") ?? false}
                          onChange={() => {
                            const _votes = !watch("votes");
                            setValue("votes", _votes);
                            if (watch("id") != null) onSettingsUpdate("votes", _votes);
                          }}
                          size="sm"
                        />
                      </div>
                    </div> */}

                    {/* <div className="relative flex justify-between items-center gap-2">
                      <div className="text-custom-text-100">Allow issue proposals</div>
                      <div>
                        <ToggleSwitch
                          value={watch("inbox") ?? false}
                          onChange={() => {
                            setValue("inbox", !watch("inbox"));
                          }}
                          size="sm"
                        />
                      </div>
                    </div> */}
                  </div>
                </div>

                {/* modal handlers */}
                <div className="border-t border-custom-border-300 p-3 px-4 relative flex justify-between items-center">
                  <div className="flex items-center gap-1 text-custom-text-300">
                    <div className="w-[20px] h-[20px] overflow-hidden flex items-center">
                      <span className="material-symbols-rounded text-[18px]">public</span>
                    </div>
                    <div className="text-sm">Anyone with the link can access</div>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    {watch("id") != null ? (
                      <PrimaryButton
                        outline
                        onClick={handleSubmit(onSettingsUnPublish)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Unpublishing..." : "Unpublish"}
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton
                        onClick={handleSubmit(onSettingsPublish)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Publishing..." : "Publish"}
                      </PrimaryButton>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
