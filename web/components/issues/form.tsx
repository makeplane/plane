import React, { FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { AIService } from "services/ai.service";
import { FileService } from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
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
  IssueModuleSelect,
  IssueCycleSelect,
} from "components/issues/select";
import { CreateStateModal } from "components/states";
import { CreateLabelModal } from "components/labels";
// ui
import { Button, CustomMenu, Input, ToggleSwitch } from "@plane/ui";
// icons
import { LayoutPanelTop, Sparkle, X } from "lucide-react";
// types
import type { IIssue, ISearchIssueResponse } from "types";
// components
import { RichTextEditorWithRef } from "@plane/rich-text-editor";
import useEditorSuggestions from "hooks/use-editor-suggestions";

const defaultValues: Partial<IIssue> = {
  project: "",
  name: "",
  description_html: "<p></p>",
  estimate_point: null,
  state: "",
  parent: null,
  priority: "none",
  assignees: [],
  labels: [],
  start_date: null,
  target_date: null,
};

export interface IssueFormProps {
  handleFormSubmit: (values: Partial<IIssue>) => Promise<void>;
  initialData?: Partial<IIssue>;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  createMore: boolean;
  setCreateMore: React.Dispatch<React.SetStateAction<boolean>>;
  handleDiscardClose: () => void;
  status: boolean;
  handleFormDirty: (payload: Partial<IIssue> | null) => void;
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
    | "module"
    | "cycle"
  )[];
}

// services
const aiService = new AIService();
const fileService = new FileService();

export const IssueForm: FC<IssueFormProps> = observer((props) => {
  const {
    handleFormSubmit,
    initialData,
    projectId,
    setActiveProject,
    createMore,
    setCreateMore,
    handleDiscardClose,
    status,
    fieldsToShow,
    handleFormDirty,
  } = props;
  // states
  const [stateModal, setStateModal] = useState(false);
  const [labelModal, setLabelModal] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);
  // refs
  const editorRef = useRef<any>(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    user: userStore,
    appConfig: { envConfig },
  } = useMobxStore();
  const user = userStore.currentUser;
  // hooks
  const editorSuggestion = useEditorSuggestions();
  const { setToastAlert } = useToast();
  // form info
  const {
    formState: { errors, isSubmitting, isDirty },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
    setFocus,
  } = useForm<IIssue>({
    defaultValues: initialData ?? defaultValues,
    reValidateMode: "onChange",
  });

  const issueName = watch("name");

  const payload: Partial<IIssue> = {
    name: getValues("name"),
    description: getValues("description"),
    state: getValues("state"),
    priority: getValues("priority"),
    assignees: getValues("assignees"),
    labels: getValues("labels"),
    start_date: getValues("start_date"),
    target_date: getValues("target_date"),
    project: getValues("project"),
    parent: getValues("parent"),
    cycle: getValues("cycle"),
    module: getValues("module"),
  };

  useEffect(() => {
    if (isDirty) handleFormDirty(payload);
    else handleFormDirty(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload), isDirty]);

  const handleCreateUpdateIssue = async (formData: Partial<IIssue>) => {
    await handleFormSubmit(formData);

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
    if (!workspaceSlug || !projectId || !user) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(workspaceSlug as string, projectId as string, {
        prompt: issueName,
        task: "Generate a proper description for this issue.",
      })
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
      project: projectId,
      ...initialData,
    });
  }, [setFocus, initialData, projectId, reset]);

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
          <CreateStateModal isOpen={stateModal} handleClose={() => setStateModal(false)} projectId={projectId} />
          <CreateLabelModal
            isOpen={labelModal}
            handleClose={() => setLabelModal(false)}
            projectId={projectId}
            onSuccess={(response) => setValue("labels", [...watch("labels"), response.id])}
          />
        </>
      )}
      <form onSubmit={handleSubmit(handleCreateUpdateIssue)}>
        <div className="space-y-5">
          <div className="flex items-center gap-x-2">
            {(fieldsToShow.includes("all") || fieldsToShow.includes("project")) && (
              <Controller
                control={control}
                name="project"
                rules={{
                  required: true,
                }}
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <IssueProjectSelect
                    value={value}
                    error={error}
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
                  <X
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
                        placeholder="Issue Title"
                        className="resize-none text-xl w-full focus:border-blue-400"
                      />
                    )}
                  />
                </div>
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("description")) && (
                <div className="relative">
                  <div className="absolute bottom-3.5 right-3.5 z-10 border-0.5 flex rounded bg-custom-background-80">
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
                            <Sparkle className="h-4 w-4" />I{"'"}m feeling lucky
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
                      onClick={() => setGptAssistantModal((prevData) => !prevData)}
                    >
                      <Sparkle className="h-4 w-4" />
                      AI
                    </button>
                  </div>
                  <Controller
                    name="description_html"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <RichTextEditorWithRef
                        cancelUploadImage={fileService.cancelUpload}
                        uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                        deleteFile={fileService.deleteImage}
                        restoreFile={fileService.restoreImage}
                        ref={editorRef}
                        debouncedUpdatesEnabled={false}
                        value={
                          !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                            ? watch("description_html")
                            : value
                        }
                        customClassName="min-h-[7rem] border-custom-border-100"
                        onChange={(description: Object, description_html: string) => {
                          onChange(description_html);
                          setValue("description", description);
                        }}
                        mentionHighlights={editorSuggestion.mentionHighlights}
                        mentionSuggestions={editorSuggestion.mentionSuggestions}
                      />
                    )}
                  />
                  {envConfig?.has_openai_configured && (
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
                  )}
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
                {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && (
                  <Controller
                    control={control}
                    name="module"
                    render={({ field: { value, onChange } }) => (
                      <IssueModuleSelect
                        workspaceSlug={workspaceSlug as string}
                        projectId={projectId}
                        value={value}
                        onChange={(val: string) => {
                          onChange(val);
                        }}
                      />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("cycle")) && (
                  <Controller
                    control={control}
                    name="cycle"
                    render={({ field: { value, onChange } }) => (
                      <IssueCycleSelect
                        workspaceSlug={workspaceSlug as string}
                        projectId={projectId}
                        value={value}
                        onChange={(val: string) => {
                          onChange(val);
                        }}
                      />
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) && (
                  <>
                    <Controller
                      control={control}
                      name="estimate_point"
                      render={({ field: { value, onChange } }) => (
                        <IssueEstimateSelect value={value} onChange={onChange} />
                      )}
                    />
                  </>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <>
                    {watch("parent") ? (
                      <CustomMenu
                        customButton={
                          <button
                            type="button"
                            className="flex items-center justify-between gap-1 w-full cursor-pointer rounded border-[0.5px] border-custom-border-300 text-custom-text-200 px-2 py-1 text-xs hover:bg-custom-background-80"
                          >
                            <div className="flex items-center gap-1 text-custom-text-200">
                              <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {selectedParentIssue &&
                                  `${selectedParentIssue.project__identifier}-
                                  ${selectedParentIssue.sequence_id}`}
                              </span>
                            </div>
                          </button>
                        }
                        placement="bottom-start"
                      >
                        <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueListModalOpen(true)}>
                          Change parent issue
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem className="!p-1" onClick={() => setValue("parent", null)}>
                          Remove parent issue
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center justify-between gap-1 w-min cursor-pointer rounded border-[0.5px] border-custom-border-300 text-custom-text-200 px-2 py-1 text-xs hover:bg-custom-background-80"
                        onClick={() => setParentIssueListModalOpen(true)}
                      >
                        <div className="flex items-center gap-1 text-custom-text-300">
                          <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">Add Parent</span>
                        </div>
                      </button>
                    )}

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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="-mx-5 mt-5 flex items-center justify-between gap-2 border-t border-custom-border-100 px-5 pt-5">
          {!status && (
            <div
              className="flex cursor-default items-center gap-1.5"
              onClick={() => setCreateMore((prevData) => !prevData)}
            >
              <div className="flex cursor-pointer items-center justify-center">
                <ToggleSwitch value={createMore} onChange={() => {}} size="sm" />
              </div>
              <span className="text-xs">Create more</span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => {
                handleDiscardClose();
              }}
            >
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
              {status
                ? isSubmitting
                  ? "Updating Issue..."
                  : "Update Issue"
                : isSubmitting
                ? "Adding Issue..."
                : "Add Issue"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
});
