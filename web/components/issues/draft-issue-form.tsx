import React, { FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import { Sparkle, X } from "lucide-react";
// hooks
import { useApplication, useEstimate, useMention, useProject, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// services
import { AIService } from "services/ai.service";
import { FileService } from "services/file.service";
// components
import { GptAssistantPopover } from "components/core";
import { ParentIssuesListModal } from "components/issues";
import { IssueLabelSelect } from "components/issues/select";
import { CreateStateModal } from "components/states";
import { CreateLabelModal } from "components/labels";
import { RichTextEditorWithRef } from "@plane/rich-text-editor";
import {
  CycleDropdown,
  DateDropdown,
  EstimateDropdown,
  ModuleDropdown,
  PriorityDropdown,
  ProjectDropdown,
  ProjectMemberDropdown,
  StateDropdown,
} from "components/dropdowns";
// ui
import { Button, CustomMenu, Input, ToggleSwitch } from "@plane/ui";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import type { IUser, TIssue, ISearchIssueResponse } from "@plane/types";

const aiService = new AIService();
const fileService = new FileService();

const defaultValues: Partial<TIssue> = {
  project_id: "",
  name: "",
  description_html: "<p></p>",
  estimate_point: null,
  state_id: "",
  parent_id: null,
  priority: "none",
  assignee_ids: [],
  label_ids: [],
  start_date: undefined,
  target_date: undefined,
};

interface IssueFormProps {
  handleFormSubmit: (
    formData: Partial<TIssue>,
    action?: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue"
  ) => Promise<void>;
  data?: Partial<TIssue> | null;
  isOpen: boolean;
  prePopulatedData?: Partial<TIssue> | null;
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

export const DraftIssueForm: FC<IssueFormProps> = observer((props) => {
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
    fieldsToShow,
    handleDiscard,
  } = props;
  // states
  const [stateModal, setStateModal] = useState(false);
  const [labelModal, setLabelModal] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [gptAssistantModal, setGptAssistantModal] = useState(false);
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);
  // store hooks
  const { areEstimatesEnabledForProject } = useEstimate();
  const { mentionHighlights, mentionSuggestions } = useMention();
  // hooks
  const { setValue: setLocalStorageValue } = useLocalStorage("draftedIssue", {});
  const { setToastAlert } = useToast();
  // refs
  const editorRef = useRef<any>(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;

  // store
  const {
    config: { envConfig },
  } = useApplication();
  const { getProjectById } = useProject();
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
    setFocus,
  } = useForm<TIssue>({
    defaultValues: prePopulatedData ?? defaultValues,
    reValidateMode: "onChange",
  });

  const issueName = watch("name");

  const payload: Partial<TIssue> = {
    name: watch("name"),
    description_html: watch("description_html"),
    state_id: watch("state_id"),
    priority: watch("priority"),
    assignee_ids: watch("assignee_ids"),
    label_ids: watch("label_ids"),
    start_date: watch("start_date"),
    target_date: watch("target_date"),
    project_id: watch("project_id"),
    parent_id: watch("parent_id"),
    cycle_id: watch("cycle_id"),
    module_ids: watch("module_ids"),
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

  // const onClose = () => {
  //   handleClose();
  // };

  const handleCreateUpdateIssue = async (
    formData: Partial<TIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    await handleFormSubmit(
      {
        ...(data ?? {}),
        ...formData,
        // is_draft: action === "createDraft" || action === "updateDraft",
      },
      action
    );
    // TODO: check_with_backend

    setGptAssistantModal(false);

    reset({
      ...defaultValues,
      project_id: projectId,
      description_html: "<p></p>",
    });
    editorRef?.current?.clearEditor();
  };

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    // setValue("description", {});
    setValue("description_html", `${watch("description_html")}<p>${response}</p>`);
    editorRef.current?.setEditorValue(`${watch("description_html")}`);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

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
  }, [setFocus]);

  // update projectId in form when projectId changes
  useEffect(() => {
    reset({
      ...getValues(),
      project_id: projectId,
    });
  }, [getValues, projectId, reset]);

  const startDate = watch("start_date");
  const targetDate = watch("target_date");

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const projectDetails = getProjectById(projectId);

  return (
    <>
      {projectId && (
        <>
          <CreateStateModal isOpen={stateModal} handleClose={() => setStateModal(false)} projectId={projectId} />
          <CreateLabelModal
            isOpen={labelModal}
            handleClose={() => setLabelModal(false)}
            projectId={projectId}
            onSuccess={(response) => setValue("label_ids", [...watch("label_ids"), response.id])}
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
                name="project_id"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <ProjectDropdown
                      value={value}
                      onChange={(val) => {
                        onChange(val);
                        setActiveProject(val);
                      }}
                      buttonVariant="border-with-text"
                    />
                  </div>
                )}
              />
            )}
            <h3 className="text-xl font-semibold leading-6 text-custom-text-100">
              {status ? "Update" : "Create"} issue
            </h3>
          </div>
          {watch("parent_id") &&
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
                      setValue("parent_id", null);
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
                        className="w-full resize-none text-xl"
                      />
                    )}
                  />
                </div>
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("description")) && (
                <div className="relative">
                  <div className="border-0.5 absolute bottom-3.5 right-3.5 flex items-center gap-2">
                    {issueName && issueName !== "" && (
                      <button
                        type="button"
                        className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-80 ${
                          iAmFeelingLucky ? "cursor-wait" : ""
                        }`}
                        onClick={handleAutoGenerateDescription}
                        disabled={iAmFeelingLucky}
                      >
                        {iAmFeelingLucky ? (
                          "Generating response..."
                        ) : (
                          <>
                            <Sparkle className="h-3.5 w-3.5" />I{"'"}m feeling lucky
                          </>
                        )}
                      </button>
                    )}
                    {envConfig?.has_openai_configured && (
                      <GptAssistantPopover
                        isOpen={gptAssistantModal}
                        projectId={projectId}
                        handleClose={() => {
                          setGptAssistantModal((prevData) => !prevData);
                          // this is done so that the title do not reset after gpt popover closed
                          reset(getValues());
                        }}
                        onResponse={(response) => {
                          handleAiAssistance(response);
                        }}
                        button={
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-80"
                            onClick={() => setGptAssistantModal((prevData) => !prevData)}
                          >
                            <Sparkle className="h-3.5 w-3.5" />
                            AI
                          </button>
                        }
                        className=" !min-w-[38rem]"
                        placement="top-end"
                      />
                    )}
                  </div>
                  <Controller
                    name="description_html"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <RichTextEditorWithRef
                        cancelUploadImage={fileService.cancelUpload}
                        uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                        deleteFile={fileService.getDeleteImageFunction(workspaceId)}
                        restoreFile={fileService.getRestoreImageFunction(workspaceId)}
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
                        }}
                        mentionHighlights={mentionHighlights}
                        mentionSuggestions={mentionSuggestions}
                      />
                    )}
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {(fieldsToShow.includes("all") || fieldsToShow.includes("state")) && (
                  <Controller
                    control={control}
                    name="state_id"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <StateDropdown
                          value={value}
                          onChange={onChange}
                          projectId={projectId}
                          buttonVariant="border-with-text"
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("priority")) && (
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <PriorityDropdown value={value} onChange={onChange} buttonVariant="border-with-text" />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("assignee")) && (
                  <Controller
                    control={control}
                    name="assignee_ids"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <ProjectMemberDropdown
                          projectId={projectId}
                          value={value}
                          onChange={onChange}
                          buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
                          buttonClassName={value?.length > 0 ? "hover:bg-transparent px-0" : ""}
                          placeholder="Assignees"
                          multiple
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("label")) && (
                  <Controller
                    control={control}
                    name="label_ids"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <IssueLabelSelect
                          setIsOpen={setLabelModal}
                          value={value}
                          onChange={onChange}
                          projectId={projectId}
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("startDate")) && (
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <DateDropdown
                          value={value}
                          onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                          buttonVariant="border-with-text"
                          placeholder="Start date"
                          maxDate={maxDate ?? undefined}
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("dueDate")) && (
                  <Controller
                    control={control}
                    name="target_date"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <DateDropdown
                          value={value}
                          onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                          buttonVariant="border-with-text"
                          placeholder="Due date"
                          minDate={minDate ?? undefined}
                        />
                      </div>
                    )}
                  />
                )}
                {projectDetails?.cycle_view && (
                  <Controller
                    control={control}
                    name="cycle_id"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <CycleDropdown
                          projectId={projectId}
                          onChange={(cycleId) => onChange(cycleId)}
                          value={value}
                          buttonVariant="border-with-text"
                        />
                      </div>
                    )}
                  />
                )}

                {projectDetails?.module_view && workspaceSlug && (
                  <Controller
                    control={control}
                    name="module_ids"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <ModuleDropdown
                          projectId={projectId}
                          value={value ?? []}
                          onChange={onChange}
                          buttonVariant="border-with-text"
                          multiple
                        />
                      </div>
                    )}
                  />
                )}

                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) &&
                  areEstimatesEnabledForProject(projectId) && (
                    <Controller
                      control={control}
                      name="estimate_point"
                      render={({ field: { value, onChange } }) => (
                        <div className="h-7">
                          <EstimateDropdown
                            value={value}
                            onChange={onChange}
                            projectId={projectId}
                            buttonVariant="border-with-text"
                          />
                        </div>
                      )}
                    />
                  )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("parent")) && (
                  <Controller
                    control={control}
                    name="parent_id"
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
                    {watch("parent_id") ? (
                      <>
                        <CustomMenu.MenuItem onClick={() => setParentIssueListModalOpen(true)}>
                          Change parent issue
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem onClick={() => setValue("parent_id", null)}>
                          Remove parent issue
                        </CustomMenu.MenuItem>
                      </>
                    ) : (
                      <CustomMenu.MenuItem onClick={() => setParentIssueListModalOpen(true)}>
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
            <Button variant="neutral-primary" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
            <Button
              variant="neutral-primary"
              size="sm"
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
              size="sm"
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
});
