import { ChangeEvent, FC, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Controller, useForm } from "react-hook-form";
// icons
import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
// components
import {
  IssueAssigneeSelect,
  IssueLabelSelect,
  IssueParentSelect,
  IssuePrioritySelect,
  IssueProjectSelect,
  IssueStateSelect,
} from "components/issues/select";
// ui
import { Button, Input, Loader } from "components/ui";
// helpers
import { cosineSimilarity } from "helpers/string.helper";
// types
import type { IIssue, IssueResponse } from "types";
// Rich text components
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
  workspaceSlug: string;
  projectId: string;
  initialData: Partial<IIssue>;
  issues: IIssue[];
}

export const IssueForm: FC<IssueFormProps> = (props) => {
  // props
  const { handleFormSubmit, workspaceSlug, initialData, issues = [], projectId } = props;
  // states
  const [isCreateMoreActive, setCreateMoreActive] = useState(false);
  const [mostSimilarIssue, setMostSimilarIssue] = useState<IIssue | undefined>();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
    control,
    watch,
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
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5">
        <div className="flex items-center gap-x-2">
          <Controller
            control={control}
            name="project"
            render={({ field: { value, onChange } }) => (
              <IssueProjectSelect workspaceSlug={workspaceSlug} value={value} onChange={onChange} />
            )}
          />
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {initialData ? "Update" : "Create"} Issue
          </h3>
        </div>
        {/* {watch("parent") && watch("parent") !== "" ? (
          <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-gray-100 p-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: issues?.results.find((i) => i.id === watch("parent"))
                    ?.state_detail.color,
                }}
              />
              <span className="flex-shrink-0 text-gray-600">
                {projects?.find((p) => p.id === activeProject)?.identifier}-
                {issues?.results.find((i) => i.id === watch("parent"))?.sequence_id}
              </span>
              <span className="truncate font-medium">
                {issues?.results.find((i) => i.id === watch("parent"))?.name.substring(0, 50)}
              </span>
              <XMarkIcon
                className="h-3 w-3 cursor-pointer"
                onClick={() => setValue("parent", null)}
              />
            </div>
          </div>
        ) : null} */}
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
              <IssueStateSelect />
              <IssueCycleSelect
                control={control}
                setIsOpen={setIsCycleModalOpen}
                activeProject={activeProject ?? ""}
              />
              <IssuePrioritySelect control={control} />
              <Controller
                control={control}
                name="priority"
                render={({ field: { value, onChange } }) => (
                  <IssueAssigneeSelect
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <IssueLabelSelect control={control} />
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
                issues={issues?.results ?? []}
              />
              {/* <Menu as="div" className="relative inline-block">
                <Menu.Button className="grid cursor-pointer place-items-center rounded-md border p-1 py-0.5 shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </Menu.Button>

                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {watch("parent") && watch("parent") !== "" ? (
                        <>
                          <Menu.Item as="div">
                            <button
                              type="button"
                              className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                              onClick={() => setParentIssueListModalOpen(true)}
                            >
                              Change parent issue
                            </button>
                          </Menu.Item>
                          <Menu.Item as="div">
                            <button
                              type="button"
                              className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                              onClick={() => setValue("parent", null)}
                            >
                              Remove parent issue
                            </button>
                          </Menu.Item>
                        </>
                      ) : (
                        <Menu.Item as="div">
                          <button
                            type="button"
                            className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                            onClick={() => setParentIssueListModalOpen(true)}
                          >
                            Select Parent Issue
                          </button>
                        </Menu.Item>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu> */}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <div
          className="flex cursor-pointer items-center gap-1"
          onClick={() => setCreateMoreActive(!isCreateMoreActive)}
        >
          <span className="text-xs">Create more</span>
          <button
            type="button"
            className={`pointer-events-none relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              isCreateMoreActive ? "bg-theme" : "bg-gray-300"
            } transition-colors duration-300 ease-in-out focus:outline-none`}
            role="switch"
            aria-checked="false"
          >
            <span className="sr-only">Create more</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-3 w-3 ${
                isCreateMoreActive ? "translate-x-3" : "translate-x-0"
              } transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out`}
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button theme="secondary" onClick={handleDiscard}>
            Discard
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {initialData
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
  );
};
