import React, { FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { LayoutPanelTop, Sparkle, X } from "lucide-react";
// hooks
import { useApplication, useEstimate, useMention, useProject } from "hooks/store";
import useToast from "hooks/use-toast";
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
import type { TIssue, ISearchIssueResponse } from "@plane/types";

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

export interface IssueFormProps {
  handleFormSubmit: (values: Partial<TIssue>) => Promise<void>;
  initialData?: Partial<TIssue>;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  createMore: boolean;
  setCreateMore: React.Dispatch<React.SetStateAction<boolean>>;
  handleDiscardClose: () => void;
  status: boolean;
  handleFormDirty: (payload: Partial<TIssue> | null) => void;
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
  // store hooks
  const {
    config: { envConfig },
  } = useApplication();
  const { getProjectById } = useProject();
  const { areEstimatesActiveForProject } = useEstimate();
  const { mentionHighlights, mentionSuggestions } = useMention();
  // toast alert
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
  } = useForm<TIssue>({
    defaultValues: initialData ?? defaultValues,
    reValidateMode: "onChange",
  });

  const issueName = watch("name");

  const payload: Partial<TIssue> = {
    name: getValues("name"),
    state_id: getValues("state_id"),
    priority: getValues("priority"),
    assignee_ids: getValues("assignee_ids"),
    label_ids: getValues("label_ids"),
    start_date: getValues("start_date"),
    target_date: getValues("target_date"),
    project_id: getValues("project_id"),
    parent_id: getValues("parent_id"),
    cycle_id: getValues("cycle_id"),
    module_id: getValues("module_id"),
  };

  // derived values
  const projectDetails = getProjectById(projectId);

  useEffect(() => {
    if (isDirty) handleFormDirty(payload);
    else handleFormDirty(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload), isDirty]);

  const handleCreateUpdateIssue = async (formData: Partial<TIssue>) => {
    await handleFormSubmit(formData);

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

    setValue("description_html", `${watch("description_html")}<p>${response}</p>`);
    editorRef.current?.setEditorValue(`${watch("description_html")}`);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(workspaceSlug.toString(), projectId.toString(), {
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
      ...initialData,
    });
  }, [setFocus, initialData, reset]);

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
      <form onSubmit={handleSubmit(handleCreateUpdateIssue)}>
        <div className="space-y-5">
          <div className="flex items-center gap-x-2">
            {(fieldsToShow.includes("all") || fieldsToShow.includes("project")) && !status && (
              <Controller
                control={control}
                name="project_id"
                rules={{
                  required: true,
                }}
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
              {status ? "Update" : "Create"} Issue
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
                        placeholder="Issue Title"
                        className="w-full resize-none text-xl focus:border-blue-400"
                      />
                    )}
                  />
                </div>
              )}
              {(fieldsToShow.includes("all") || fieldsToShow.includes("description")) && (
                <div className="relative">
                  <div className="border-0.5 absolute bottom-3.5 right-3.5 z-10 flex rounded bg-custom-background-80">
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
                        placement="top-end"
                        button={
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-custom-background-90"
                            onClick={() => setGptAssistantModal((prevData) => !prevData)}
                          >
                            <Sparkle className="h-4 w-4" />
                            AI
                          </button>
                        }
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
                  <div>
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
                  </div>
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("cycle")) && projectDetails?.cycle_view && (
                  <Controller
                    control={control}
                    name="cycle_id"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <CycleDropdown
                          projectId={projectId}
                          onChange={onChange}
                          value={value}
                          buttonVariant="border-with-text"
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("module")) && projectDetails?.module_view && (
                  <Controller
                    control={control}
                    name="module_id"
                    render={({ field: { value, onChange } }) => (
                      <div className="h-7">
                        <ModuleDropdown
                          projectId={projectId}
                          value={value}
                          onChange={onChange}
                          buttonVariant="border-with-text"
                        />
                      </div>
                    )}
                  />
                )}
                {(fieldsToShow.includes("all") || fieldsToShow.includes("estimate")) &&
                  areEstimatesActiveForProject(projectId) && (
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
                  <>
                    {watch("parent_id") ? (
                      <CustomMenu
                        customButton={
                          <button
                            type="button"
                            className="h-7 flex items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs text-custom-text-200 hover:bg-custom-background-80"
                          >
                            <div className="flex items-center gap-1 text-custom-text-200">
                              <LayoutPanelTop className="h-2.5 w-2.5 flex-shrink-0" />
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
                        <CustomMenu.MenuItem className="!p-1" onClick={() => setValue("parent_id", null)}>
                          Remove parent issue
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    ) : (
                      <button
                        type="button"
                        className="h-7 flex items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs hover:bg-custom-background-80"
                        onClick={() => setParentIssueListModalOpen(true)}
                      >
                        <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">Add parent</span>
                      </button>
                    )}

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
          <div className="ml-auto flex items-center gap-2">
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
