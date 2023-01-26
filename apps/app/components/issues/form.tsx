import { ChangeEvent, FC, useState, useEffect } from "react";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// components
import {
  IssueAssigneeSelect,
  IssueLabelSelect,
  IssueParentSelect,
  IssuePrioritySelect,
  IssueProjectSelect,
  IssueStateSelect,
} from "components/issues/select";
import { CycleSelect as IssueCycleSelect } from "components/cycles/select";
import CreateUpdateStateModal from "components/project/issues/BoardView/state/create-update-state-modal";
import CreateUpdateCycleModal from "components/project/cycles/create-update-cycle-modal";
// ui
import { Button, CustomMenu, Input, Loader } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// helpers
import { cosineSimilarity } from "helpers/string.helper";
// types
import type { IIssue } from "types";
// rich-text-editor
const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="12rem" width="100%" />
    </Loader>
  ),
});

const defaultValues: Partial<IIssue> = {
  project: "",
  name: "",
  description: "",
  description_html: "<p></p>",
  state: "",
  cycle: null,
  priority: null,
  labels_list: [],
};

export interface IssueFormProps {
  handleFormSubmit: (values: Partial<IIssue>) => void;
  initialData?: Partial<IIssue>;
  issues: IIssue[];
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  createMore: boolean;
  setCreateMore: React.Dispatch<React.SetStateAction<boolean>>;
  handleClose: () => void;
  status: boolean;
}

export const IssueForm: FC<IssueFormProps> = ({
  handleFormSubmit,
  initialData,
  issues = [],
  projectId,
  setActiveProject,
  createMore,
  setCreateMore,
  handleClose,
  status,
}) => {
  // states
  const [mostSimilarIssue, setMostSimilarIssue] = useState<IIssue | undefined>();
  const [cycleModal, setCycleModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
  } = useForm<IIssue>({
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const similarIssue = issues?.find((i: IIssue) => cosineSimilarity(i.name, value) > 0.7);
    setMostSimilarIssue(similarIssue);
  };

  const handleDiscard = () => {
    reset({ ...defaultValues, project: projectId });
    handleClose();
  };

  const handleCreateUpdateIssue = async (formData: Partial<IIssue>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
      project: projectId,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...watch(),
      project: projectId,
      ...initialData,
    });
  }, [initialData, reset, watch, projectId]);

  return (
    <>
      {projectId && (
        <>
          <CreateUpdateStateModal
            isOpen={stateModal}
            handleClose={() => setStateModal(false)}
            projectId={projectId}
          />
          <CreateUpdateCycleModal
            isOpen={cycleModal}
            setIsOpen={setCycleModal}
            projectId={projectId}
          />
        </>
      )}
      <form onSubmit={handleSubmit(handleCreateUpdateIssue)}>
        <div className="space-y-5">
          <div className="flex items-center gap-x-2">
            <Controller
              control={control}
              name="project"
              render={({ field: { value, onChange } }) => (
                <IssueProjectSelect
                  value={value}
                  onChange={onChange}
                  setActiveProject={setActiveProject}
                />
              )}
            />
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {status ? "Update" : "Create"} Issue
            </h3>
          </div>
          {watch("parent") && watch("parent") !== "" ? (
            <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-gray-100 p-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: issues.find((i) => i.id === watch("parent"))?.state_detail
                      .color,
                  }}
                />
                <span className="flex-shrink-0 text-gray-600">
                  {/* {projects?.find((p) => p.id === projectId)?.identifier}- */}
                  {issues.find((i) => i.id === watch("parent"))?.sequence_id}
                </span>
                <span className="truncate font-medium">
                  {issues.find((i) => i.id === watch("parent"))?.name.substring(0, 50)}
                </span>
                <XMarkIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setValue("parent", null)}
                />
              </div>
            </div>
          ) : null}
          <div className="space-y-3">
            <div className="mt-2 space-y-3">
              <div>
                <Input
                  id="name"
                  label="Title"
                  name="name"
                  onChange={handleTitleChange}
                  className="resize-none"
                  placeholder="Enter title"
                  autoComplete="off"
                  error={errors.name}
                  register={register}
                  validations={{
                    required: "Name is required",
                    maxLength: {
                      value: 255,
                      message: "Name should be less than 255 characters",
                    },
                  }}
                />
                {mostSimilarIssue && (
                  <div className="flex items-center gap-x-2">
                    <p className="text-sm text-gray-500">
                      <Link
                        href={`/${workspaceSlug}/projects/${projectId}/issues/${mostSimilarIssue}`}
                      >
                        <a target="_blank" type="button" className="inline text-left">
                          <span>Did you mean </span>
                          <span className="italic">
                            {mostSimilarIssue?.project_detail.identifier}-
                            {mostSimilarIssue?.sequence_id}: {mostSimilarIssue?.name}{" "}
                          </span>
                          ?
                        </a>
                      </Link>{" "}
                    </p>
                    <button
                      type="button"
                      className="text-sm text-blue-500"
                      onClick={() => {
                        setMostSimilarIssue(undefined);
                      }}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor={"description"} className="mb-2 text-gray-500">
                  Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <RemirrorRichTextEditor
                      value={value}
                      onBlur={(jsonValue, htmlValue) => {
                        setValue("description", jsonValue);
                        setValue("description_html", htmlValue);
                      }}
                      placeholder="Enter Your Text..."
                    />
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <Controller
                  control={control}
                  name="cycle"
                  render={({ field: { value, onChange } }) => (
                    <IssueCycleSelect projectId={projectId} value={value} onChange={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { value, onChange } }) => (
                    <IssuePrioritySelect value={value} onChange={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="assignees_list"
                  render={({ field: { value, onChange } }) => (
                    <IssueAssigneeSelect projectId={projectId} value={value} onChange={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="labels_list"
                  render={({ field: { value, onChange } }) => (
                    <IssueLabelSelect value={value} onChange={onChange} projectId={projectId} />
                  )}
                />
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="date"
                      value={value ?? ""}
                      onChange={(e: any) => {
                        onChange(e.target.value);
                      }}
                      className="cursor-pointer rounded-md border px-2 py-[3px] text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                />
                <IssueParentSelect
                  control={control}
                  isOpen={parentIssueListModalOpen}
                  setIsOpen={setParentIssueListModalOpen}
                  issues={issues ?? []}
                />
                <CustomMenu ellipsis>
                  {watch("parent") && watch("parent") !== "" ? (
                    <>
                      <CustomMenu.MenuItem
                        renderAs="button"
                        onClick={() => setParentIssueListModalOpen(true)}
                      >
                        Change parent issue
                      </CustomMenu.MenuItem>
                      <CustomMenu.MenuItem
                        renderAs="button"
                        onClick={() => setValue("parent", null)}
                      >
                        Remove parent issue
                      </CustomMenu.MenuItem>
                    </>
                  ) : (
                    <CustomMenu.MenuItem
                      renderAs="button"
                      onClick={() => setParentIssueListModalOpen(true)}
                    >
                      Select Parent Issue
                    </CustomMenu.MenuItem>
                  )}
                </CustomMenu>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <div
            className="flex cursor-pointer items-center gap-1"
            onClick={() => setCreateMore((prevData) => !prevData)}
          >
            <span className="text-xs">Create more</span>
            <button
              type="button"
              className={`pointer-events-none relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
                createMore ? "bg-theme" : "bg-gray-300"
              } transition-colors duration-300 ease-in-out focus:outline-none`}
              role="switch"
              aria-checked="false"
            >
              <span className="sr-only">Create more</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-3 w-3 ${
                  createMore ? "translate-x-3" : "translate-x-0"
                } transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button theme="secondary" onClick={handleDiscard}>
              Discard
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {status
                ? isSubmitting
                  ? "Updating Issue..."
                  : "Update Issue"
                : isSubmitting
                ? "Creating Issue..."
                : "Create Issue"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};
