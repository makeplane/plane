import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
import issuesService from "services/issues.service";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import SingleLabel from "components/project/settings/single-label";
// ui
import { Button, Input, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels } from "types";
import type { NextPageContext, NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUE_LABELS, WORKSPACE_DETAILS } from "constants/fetch-keys";

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "#ff0000",
};

type TLabelSettingsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const LabelsSettings: NextPage<TLabelSettingsProps> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const [newLabelForm, setNewLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelIdForUpdate, setLabelIdForUpdate] = useState<string | null>(null);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<IIssueLabels>({ defaultValues });

  const { data: issueLabels, mutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const handleNewLabel: SubmitHandler<IIssueLabels> = async (formData) => {
    if (!activeWorkspace || !projectDetails || isSubmitting) return;
    await issuesService
      .createIssueLabel(activeWorkspace.slug, projectDetails.id, formData)
      .then((res) => {
        reset(defaultValues);
        mutate((prevData) => [...(prevData ?? []), res], false);
        setNewLabelForm(false);
      });
  };

  const editLabel = (label: IIssueLabels) => {
    setNewLabelForm(true);
    setValue("color", label.color);
    setValue("name", label.name);
    setIsUpdating(true);
    setLabelIdForUpdate(label.id);
  };

  const handleLabelUpdate: SubmitHandler<IIssueLabels> = async (formData) => {
    if (!activeWorkspace || !projectDetails || isSubmitting) return;

    await issuesService
      .patchIssueLabel(activeWorkspace.slug, projectDetails.id, labelIdForUpdate ?? "", formData)
      .then((res) => {
        console.log(res);
        reset(defaultValues);
        mutate(
          (prevData) =>
            prevData?.map((p) => (p.id === labelIdForUpdate ? { ...p, ...formData } : p)),
          false
        );
        setNewLabelForm(false);
      });
  };

  const handleLabelDelete = (labelId: string) => {
    if (activeWorkspace && projectDetails) {
      mutate((prevData) => prevData?.filter((p) => p.id !== labelId), false);
      issuesService
        .deleteIssueLabel(activeWorkspace.slug, projectDetails.id, labelId)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <AppLayout
      settingsLayout="project"
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
          />
          <BreadcrumbItem title="Labels Settings" />
        </Breadcrumbs>
      }
    >
      <section className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold leading-6 text-gray-900">Labels</h3>
          <p className="mt-4 text-sm text-gray-500">Manage the labels of this project.</p>
        </div>
        <div className="flex items-center justify-between gap-2 md:w-2/3">
          <h4 className="text-md mb-1 leading-6 text-gray-900">Manage labels</h4>
          <Button
            theme="secondary"
            className="flex items-center gap-x-1"
            onClick={() => setNewLabelForm(true)}
          >
            <PlusIcon className="h-4 w-4" />
            New label
          </Button>
        </div>
        <div className="space-y-5">
          <div
            className={`flex items-center gap-2 rounded-md border p-3 md:w-2/3 ${
              newLabelForm ? "" : "hidden"
            }`}
          >
            <div className="h-8 w-8 flex-shrink-0">
              <Popover className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        open ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {watch("color") && watch("color") !== "" && (
                        <span
                          className="h-4 w-4 rounded"
                          style={{
                            backgroundColor: watch("color") ?? "green",
                          }}
                        />
                      )}
                    </Popover.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute top-full left-0 z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
                        <Controller
                          name="color"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TwitterPicker
                              color={value}
                              onChange={(value) => onChange(value.hex)}
                            />
                          )}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
            <div className="flex w-full flex-col justify-center">
              <Input
                type="text"
                id="labelName"
                name="name"
                register={register}
                placeholder="Label title"
                validations={{
                  required: "Label title is required",
                }}
                error={errors.name}
              />
            </div>
            <Button type="button" theme="secondary" onClick={() => setNewLabelForm(false)}>
              Cancel
            </Button>
            {isUpdating ? (
              <Button
                type="button"
                onClick={handleSubmit(handleLabelUpdate)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating" : "Update"}
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit(handleNewLabel)} disabled={isSubmitting}>
                {isSubmitting ? "Adding" : "Add"}
              </Button>
            )}
          </div>
          <>
            {issueLabels ? (
              issueLabels.map((label) => (
                <SingleLabel
                  key={label.id}
                  label={label}
                  issueLabels={issueLabels}
                  editLabel={editLabel}
                  handleLabelDelete={handleLabelDelete}
                />
              ))
            ) : (
              <Loader className="space-y-5 md:w-2/3">
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
              </Loader>
            )}
          </>
        </div>
      </section>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default LabelsSettings;
