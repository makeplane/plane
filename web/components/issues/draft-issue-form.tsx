import React, { FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// services
import { AIService } from "services/ai.service";
import { FileService } from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { GptAssistantModal } from "components/core";
import { ParentIssuesListModal } from "components/issues";
import {
  IssueAssigneeSelect,
  IssueDateSelect,
  IssueEstimateSelect,
  IssueLabelSelect,
  IssuePrioritySelect,
  IssueProjectSelect,
  IssueStateSelect,
} from "components/issues/select";
import { CreateStateModal } from "components/states";
import { CreateLabelModal } from "components/labels";
// ui
import { CustomMenu } from "components/ui";
import { Button, Input, ToggleSwitch } from "@plane/ui";
// icons
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { IUser, IIssue, ISearchIssueResponse } from "types";
// components
import { RichTextEditorWithRef } from "@plane/rich-text-editor";

const aiService = new AIService();
const fileService = new FileService();

const defaultValues: Partial<IIssue> = {
  project: "",
  name: "",
  description: {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  },
  description_html: "<p></p>",
  estimate_point: null,
  state: "",
  parent: null,
  priority: "none",
  assignees: [],
  assignees_list: [],
  labels: [],
  labels_list: [],
  start_date: null,
  target_date: null,
};

interface IssueFormProps {
  handleFormSubmit: (
    formData: Partial<IIssue>,
    action?: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue"
  ) => Promise<void>;
  data?: Partial<IIssue> | null;
  isOpen: boolean;
  prePopulatedData?: Partial<IIssue> | null;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  createMore: boolean;
  setCreateMore: React.Dispatch<React.SetStateAction<boolean>>;
  handleClose: () => void;
  handleDiscard: () => void;
  status: boolean;
  user: IUser | undefined;
  fieldsToShow: (
    | "project"
    | "name"
    | "description"
    | "state"
    | "priority"
    | "assignee"
    | "label"
    | "startDate"
    | "dueDate"
    | "estimate"
    | "parent"
    | "all"
  )[];
}

export const DraftIssueForm: FC<IssueFormProps> = (props) => {
  const {
    handleFormSubmit,
    data,
    isOpen,
    prePopulatedData,
    projectId,
    setActiveProject,
    createMore,
    setCreateMore,
    status,
    user,
    fieldsToShow,
    handleDiscard,
  } = props;

  const [stateModal, setStateModal] = useState(false);
  const [labelModal, setLabelModal] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);

  const { setValue: setLocalStorageValue } = useLocalStorage("draftedIssue", {});

  const editorRef = useRef<any>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
    setFocus,
  } = useForm<IIssue>({
    defaultValues: prePopulatedData ?? defaultValues,
    reValidateMode: "onChange",
  });

  const issueName = watch("name");

  const payload: Partial<IIssue> = {
    name: watch("name"),
    description: watch("description"),
    description_html: watch("description_html"),
    state: watch("state"),
    priority: watch("priority"),
    assignees: watch("assignees"),
    labels: watch("labels"),
    start_date: watch("start_date"),
    target_date: watch("target_date"),
    project: watch("project"),
    parent: watch("parent"),
    cycle: watch("cycle"),
    module: watch("module"),
  };

  useEffect(() => {
    if (!isOpen || data) return;

    setLocalStorageValue(
      JSON.stringify({
        ...payload,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload), isOpen, data]);

  // const onClose = () => {
  //   handleClose();
  // };

  useEffect(() => {
    if (!isOpen || data) return;

    setLocalStorageValue(
      JSON.stringify({
        ...payload,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload), isOpen, data]);

  // const onClose = () => {
  //   handleClose();
  // };

  const handleCreateUpdateIssue = async (
    formData: Partial<IIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    await handleFormSubmit(
      {
        ...(data ?? {}),
        ...formData,
        is_draft: action === "createDraft" || action === "updateDraft",
      },
      action
    );

    setGptAssistantModal(false);

    reset({
      ...defaultValues,
      project: projectId,
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      },
      description_html: "<p></p>",
    });
    editorRef?.current?.clearEditor();
  };

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    setValue("description", {});
    setValue("description_html", `${watch("description_html")}<p>${response}</p>`);
    editorRef.current?.setEditorValue(`${watch("description_html")}`);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(
        workspaceSlug as string,
        projectId as string,
        {
          prompt: issueName,
          task: "Generate a proper description for this issue.",
        },
        user
      )
      .then((res) => {
        if (res.response === "")
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "Issue title isn't informative enough to generate the description. Please try with a different title.",
          });
        else handleAiAssistance(res.response_html);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: error || "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: error || "Some error occurred. Please try again.",
          });
      })
      .finally(() => setIAmFeelingLucky(false));
  };

  useEffect(() => {
    setFocus("name");

    reset({
      ...defaultValues,
      ...(prePopulatedData ?? {}),
      ...(data ?? {}),
    });
  }, [setFocus, prePopulatedData, reset, data]);

  // update projectId in form when projectId changes
  useEffect(() => {
    reset({
      ...getValues(),
      project: projectId,
    });
  }, [getValues, projectId, reset]);

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <>
      {projectId && (
        <>
          <CreateStateModal
            isOpen={stateModal}
            handleClose={() => setStateModal(false)}
            projectId={projectId}
            user={user}
          />
          <CreateLabelModal
            isOpen={labelModal}
            handleClose={() => setLabelModal(false)}
            projectId={projectId}
            user={user}
            onSuccess={(response) => {
              setValue("labels", [...watch("labels"), response.id]);
              setValue("labels_list", [...watch("labels_list"), response.id]);
            }}
          />
        </>
      )}
      <form
        onSubmit={handleSubmit((formData) =>
          handleCreateUpdateIssue(formData, data ? "convertToNewIssue" : "createDraft")
        )}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-x-2">
            {(fieldsToShow.includes("all") || fieldsToShow.includes("project")) && (
              <Controller
                control={control}
                name="project"
                render={({ field: { value, onChange } }) => (
                  <IssueProjectSelect
                    value={value}
                    onChange={(val: string) => {
                      onChange(val);
                      setActiveProject(val);
                    }}
                  />
                )}
              />
            )}
            <h3 className="text-xl font-semibold leading-6 text-custom-text-100">
              {status ? "Update" : "Create"} Issue
            </h3>
          </div>
          {watch("parent") &&
            (fieldsToShow.includes("all") || fieldsToShow.includes("parent")) &&
            selectedParentIssue && (
              <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-custom-background-80 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: selectedParentIssue.state__color,
                    }}
                  />
                  <span className="flex-shrink-0 text-custom-text-200">
                    {selectedParentIssue.project__identifier}-{selectedParentIssue.sequence_id}
                  </span>
                  <span className="truncate font-medium">{selectedParentIssue.name.substring(0, 50)}</span>
                  <XMarkIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setValue("parent", null);
                      setSelectedParentIssue(null);
                    }}
                  />
                </div>
              </div>
            )}
          <div className="space-y-3">
            <div className="mt-2 space-y-3">
              {(fieldsToShow.includes("all") || fieldsToShow.includes("name")) && (
                <div>
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
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        hasError={Boolean(errors.name)}
                        placeholder="Title"
                        className="resize-none text-xl w-full"
                      />
                    )}
                  />
                </div>
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("description")) && (
                <div className="relative">
                  <div className="flex justify-end">
                    {issueName && issueName !== "" && (
                      <button
                        type="button"
                        className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90 ${
                          iAmFeelingLucky ? "cursor-wait" : ""
                        }`}
                        onClick={handleAutoGenerateDescription}
                        disabled={iAmFeelingLucky}
                      >
                        {iAmFeelingLucky ? (
                          "Generating response..."
                        ) : (
                          <>
                            <SparklesIcon className="h-4 w-4" />I{"'"}m feeling lucky
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
                      onClick={() => setGptAssistantModal((prevData) => !prevData)}
                    >
                      <SparklesIcon className="h-4 w-4" />
                      AI
                    </button>
                  </div>
                  <Controller
                    name="description_html"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <RichTextEditorWithRef
                        uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                        deleteFile={fileService.deleteImage}
                        ref={editorRef}
                        debouncedUpdatesEnabled={false}
                        value={
                          !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                            ? watch("description_html")
                            : value
                        }
                        customClassName="min-h-[150px]"
                        onChange={(description: Object, description_html: string) => {
                          onChange(description_html);
                          setValue("description", description);
                        }}
                      />
                    )}
                  />
                  <GptAssistantModal
                    isOpen={gptAssistantModal}
                    handleClose={() => {
                      setGptAssistantModal(false);
                      // this is done so that the title do not reset after gpt popover closed
                      reset(getValues());
                    }}
                    inset="top-2 left-0"
                    content=""
                    htmlContent={watch("description_html")}
                    onResponse={(response) => {
                      handleAiAssistance(response);
                    }}
                    projectId={projectId}
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                  <Controller
                    control={control}
                    name="state"
                    render={({ field: { value, onChange } }) => (
                      <IssueStateSelect
                        setIsOpen={setStateModal}
                        value={value}
                        onChange={onChange}
                        projectId={projectId}
                      />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field: { value, onChange } }) => (
                      <IssuePrioritySelect value={value} onChange={onChange} />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                  <Controller
                    control={control}
                    name="assignees"
                    render={({ field: { value, onChange } }) => (
                      <IssueAssigneeSelect projectId={projectId} value={value} onChange={onChange} />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
                  <Controller
                    control={control}
                    name="labels"
                    render={({ field: { value, onChange } }) => (
                      <IssueLabelSelect
                        setIsOpen={setLabelModal}
                        value={value}
                        onChange={onChange}
                        projectId={projectId}
                      />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("startDate")) && (
                  <div>
                    <Controller
                      control={control}
                      name="start_date"
                      render={({ field: { value, onChange } }) => (
                        <IssueDateSelect
                          label="Start date"
                          maxDate={maxDate ?? undefined}
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("dueDate")) && (
                  <div>
                    <Controller
                      control={control}
                      name="target_date"
                      render={({ field: { value, onChange } }) => (
                        <IssueDateSelect
                          label="Due date"
                          minDate={minDate ?? undefined}
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) && (
                  <div>
                    <Controller
                      control={control}
                      name="estimate_point"
                      render={({ field: { value, onChange } }) => (
                        <IssueEstimateSelect value={value} onChange={onChange} />
                      )}
                    />
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <Controller
                    control={control}
                    name="parent"
                    render={({ field: { onChange } }) => (
                      <ParentIssuesListModal
                        isOpen={parentIssueListModalOpen}
                        handleClose={() => setParentIssueListModalOpen(false)}
                        onChange={(issue) => {
                          onChange(issue.id);
                          setSelectedParentIssue(issue);
                        }}
                        projectId={projectId}
                      />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <CustomMenu ellipsis>
                    {watch("parent") ? (
                      <>
                        <CustomMenu.MenuItem renderAs="button" onClick={() => setParentIssueListModalOpen(true)}>
                          Change parent issue
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem renderAs="button" onClick={() => setValue("parent", null)}>
                          Remove parent issue
                        </CustomMenu.MenuItem>
                      </>
                    ) : (
                      <CustomMenu.MenuItem renderAs="button" onClick={() => setParentIssueListModalOpen(true)}>
                        Select Parent Issue
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="-mx-5 mt-5 flex items-center justify-between gap-2 border-t border-custom-border-200 px-5 pt-5">
          <div
            className="flex cursor-pointer items-center gap-1"
            onClick={() => setCreateMore((prevData) => !prevData)}
          >
            <span className="text-xs">Create more</span>
            <ToggleSwitch value={createMore} onChange={() => {}} size="md" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" onClick={handleDiscard}>
              Discard
            </Button>
            <Button
              variant="neutral-primary"
              loading={isSubmitting}
              onClick={handleSubmit((formData) =>
                handleCreateUpdateIssue(formData, data?.id ? "updateDraft" : "createDraft")
              )}
            >
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              loading={isSubmitting}
              variant="primary"
              onClick={handleSubmit((formData) =>
                handleCreateUpdateIssue(formData, data ? "convertToNewIssue" : "createNewIssue")
              )}
            >
              {isSubmitting ? "Saving..." : "Add Issue"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};
