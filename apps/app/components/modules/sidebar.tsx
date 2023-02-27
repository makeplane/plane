import React, { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// icons
import {
  CalendarDaysIcon,
  ChartPieIcon,
  LinkIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { Popover, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";

// services
import modulesService from "services/modules.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { LinkModal, LinksList, SidebarProgressStats } from "components/core";
import { DeleteModuleModal, SidebarLeadSelect, SidebarMembersSelect } from "components/modules";
import ProgressChart from "components/core/sidebar/progress-chart";

// components
// ui
import { CustomSelect, Loader, ProgressBar } from "components/ui";
// helpers
import { renderDateFormat, renderShortNumericDateFormat, timeAgo } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
// types
import { IIssue, IModule, ModuleIssueResponse, ModuleLink, UserAuth } from "types";
// fetch-keys
import { MODULE_DETAILS } from "constants/fetch-keys";
// constant
import { MODULE_STATUS } from "constants/module";

const defaultValues: Partial<IModule> = {
  lead: "",
  members_list: [],
  start_date: null,
  target_date: null,
  status: null,
};

type Props = {
  issues: IIssue[];
  module?: IModule;
  isOpen: boolean;
  moduleIssues: ModuleIssueResponse[] | undefined;
  userAuth: UserAuth;
};

export const ModuleDetailsSidebar: React.FC<Props> = ({
  issues,
  module,
  isOpen,
  moduleIssues,
  userAuth,
}) => {
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [moduleLinkModal, setModuleLinkModal] = useState(false);
  const [startDateRange, setStartDateRange] = useState<Date | null>(new Date());
  const [endDateRange, setEndDateRange] = useState<Date | null>(null);

  console.log("module details: ", module);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { setToastAlert } = useToast();

  const { reset, watch, control } = useForm({
    defaultValues,
  });

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(moduleIssues ?? [], "issue_detail.state_detail.group"),
  };

  const submitChanges = (data: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    mutate<IModule>(
      MODULE_DETAILS(moduleId as string),
      (prevData) => ({
        ...(prevData as IModule),
        ...data,
      }),
      false
    );

    modulesService
      .patchModule(workspaceSlug as string, projectId as string, moduleId as string, data)
      .then((res) => {
        console.log(res);
        mutate(MODULE_DETAILS(moduleId as string));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const handleCreateLink = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const payload = { metadata: {}, ...formData };

    await modulesService
      .createModuleLink(workspaceSlug as string, projectId as string, moduleId as string, payload)
      .then((res) => {
        mutate(MODULE_DETAILS(moduleId as string));
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't create the link. Please try again.",
        });
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    const updatedLinks = module.link_module.filter((l) => l.id !== linkId);

    mutate<IModule>(
      MODULE_DETAILS(module.id),
      (prevData) => ({ ...(prevData as IModule), link_module: updatedLinks }),
      false
    );

    await modulesService
      .deleteModuleLink(workspaceSlug as string, projectId as string, module.id, linkId)
      .then((res) => {
        mutate(MODULE_DETAILS(module.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (module)
      reset({
        ...module,
        members_list: module.members_list ?? module.members_detail?.map((m) => m.id),
      });
  }, [module, reset]);

  const isStartValid = new Date(`${module?.start_date}`) <= new Date();
  const isEndValid = new Date(`${module?.target_date}`) >= new Date(`${module?.start_date}`);

  return (
    <>
      <LinkModal
        isOpen={moduleLinkModal}
        handleClose={() => setModuleLinkModal(false)}
        onFormSubmit={handleCreateLink}
      />
      <DeleteModuleModal
        isOpen={moduleDeleteModal}
        setIsOpen={setModuleDeleteModal}
        data={module}
      />
      <div
        className={`fixed top-0 ${
          isOpen ? "right-0" : "-right-[24rem]"
        } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 p-5 duration-300`}
      >
        {module ? (
          <>
            <div className="flex gap-1 text-sm my-2">
              <div className="flex items-center ">
                <Controller
                  control={control}
                  name="status"
                  render={({ field: { value } }) => (
                    <CustomSelect
                      label={
                        <span
                          className={`flex items-center gap-1 text-left capitalize p-1 text-xs h-full w-full  text-gray-900`}
                        >
                          <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
                          {watch("status")}
                        </span>
                      }
                      value={value}
                      onChange={(value: any) => {
                        submitChanges({ status: value });
                      }}
                    >
                      {MODULE_STATUS.map((option) => (
                        <CustomSelect.Option key={option.value} value={option.value}>
                          <span className="text-xs">{option.label}</span>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
              <div className="flex justify-center items-center gap-2 rounded-md border bg-transparent h-full  p-2 px-4  text-xs font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus:outline-none">
                <Popover className="flex justify-center items-center relative rounded-lg">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        className={`group flex items-center  ${open ? "bg-gray-100" : ""}`}
                      >
                        <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>
                          {renderShortNumericDateFormat(`${module?.start_date}`)
                            ? renderShortNumericDateFormat(`${module?.start_date}`)
                            : "N/A"}
                        </span>
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
                        <Popover.Panel className="absolute top-10 -left-10 z-20  transform overflow-hidden">
                          <DatePicker
                            selected={startDateRange}
                            onChange={(date) => {
                              submitChanges({
                                start_date: renderDateFormat(date),
                              });
                              setStartDateRange(date);
                            }}
                            selectsStart
                            startDate={startDateRange}
                            endDate={endDateRange}
                            inline
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
                <Popover className="flex justify-center items-center relative  rounded-lg">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        className={`group flex items-center ${open ? "bg-gray-100" : ""}`}
                      >
                        <span>
                          -{" "}
                          {renderShortNumericDateFormat(`${module?.target_date}`)
                            ? renderShortNumericDateFormat(`${module?.target_date}`)
                            : "N/A"}
                        </span>
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
                        <Popover.Panel className="absolute top-10 -right-20 z-20  transform overflow-hidden">
                          <DatePicker
                            selected={endDateRange}
                            onChange={(date) => {
                              submitChanges({
                                target_date: renderDateFormat(date),
                              });
                              setEndDateRange(date);
                            }}
                            selectsEnd
                            startDate={startDateRange}
                            endDate={endDateRange}
                            minDate={startDateRange}
                            inline
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3">
              <h4 className="text-sm font-medium">{module.name}</h4>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border p-2 shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() =>
                    copyTextToClipboard(
                      `https://app.plane.so/${workspaceSlug}/projects/${projectId}/modules/${module.id}`
                    )
                      .then(() => {
                        setToastAlert({
                          type: "success",
                          title: "Module link copied to clipboard",
                        });
                      })
                      .catch(() => {
                        setToastAlert({
                          type: "error",
                          title: "Some error occurred",
                        });
                      })
                  }
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() => setModuleDeleteModal(true)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="divide-y-2 divide-gray-100 text-xs">
              <div className="py-1">
                <SidebarLeadSelect
                  control={control}
                  submitChanges={submitChanges}
                  lead={module.lead_detail}
                />
                <SidebarMembersSelect control={control} submitChanges={submitChanges} />
                <div className="flex flex-wrap items-center py-2">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <ChartPieIcon className="h-4 w-4 flex-shrink-0" />
                    <p>Progress</p>
                  </div>
                  <div className="flex items-center gap-2 sm:basis-1/2">
                    <div className="grid flex-shrink-0 place-items-center">
                      <span className="h-4 w-4">
                        <ProgressBar
                          value={groupedIssues.completed.length}
                          maxValue={moduleIssues?.length}
                        />
                      </span>
                    </div>
                    {groupedIssues.completed.length}/{moduleIssues?.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full gap-2">
              {isStartValid && isEndValid ? (
                <ProgressChart
                  issues={issues}
                  start={module?.start_date ?? ""}
                  end={module?.target_date ?? ""}
                />
              ) : (
                ""
              )}
              {issues.length > 0 ? (
                <SidebarProgressStats issues={issues} groupedIssues={groupedIssues} />
              ) : (
                ""
              )}
            </div>
            <div className="py-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h4>Links</h4>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100"
                  onClick={() => setModuleLinkModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {module.link_module && module.link_module.length > 0 ? (
                  <LinksList
                    links={module.link_module}
                    handleDeleteLink={handleDeleteLink}
                    userAuth={userAuth}
                  />
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <Loader>
            <div className="space-y-2">
              <Loader.Item height="15px" width="50%" />
              <Loader.Item height="15px" width="30%" />
            </div>
            <div className="mt-8 space-y-3">
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
            </div>
          </Loader>
        )}
      </div>
    </>
  );
};
