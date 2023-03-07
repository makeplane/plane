import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// icons
import {
  ArrowLongRightIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  LinkIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { Disclosure, Popover, Transition } from "@headlessui/react";
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
import { CustomMenu, CustomSelect, Loader, ProgressBar } from "components/ui";
// helpers
import { renderDateFormat, renderShortNumericDateFormat, timeAgo } from "helpers/date-time.helper";
import { capitalizeFirstLetter, copyTextToClipboard } from "helpers/string.helper";
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

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${module?.id}`)
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
        } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 py-5 duration-300`}
      >
        {module ? (
          <>
            <div className="flex flex-col items-start justify-center">
              <div className="flex gap-2.5 px-7 text-sm">
                <div className="flex items-center ">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field: { value } }) => (
                      <CustomSelect
                        customButton={
                          <span
                            className={`flex cursor-pointer items-center rounded border-[0.5px] border-gray-200 bg-gray-100 px-2.5 py-1.5 text-center text-sm capitalize text-gray-800 `}
                          >
                            {capitalizeFirstLetter(`${watch("status")}`)}
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
                <div className="relative flex h-full w-52 items-center justify-center gap-2 text-sm text-gray-800">
                  <Popover className="flex h-full items-center  justify-center rounded-lg">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`group flex h-full items-center gap-1 rounded border-[0.5px]  border-gray-200 bg-gray-100 px-2.5 py-1.5 text-gray-800   ${
                            open ? "bg-gray-100" : ""
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>
                            {renderShortNumericDateFormat(`${module.start_date}`)
                              ? renderShortNumericDateFormat(`${module.start_date}`)
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
                          <Popover.Panel className="absolute top-10 -right-5 z-20  transform overflow-hidden">
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
                              maxDate={endDateRange}
                              shouldCloseOnSelect
                              inline
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                  <span>
                    <ArrowLongRightIcon className="h-3 w-3" />
                  </span>
                  <Popover className="flex h-full items-center  justify-center rounded-lg">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`group flex items-center gap-1 rounded border-[0.5px] border-gray-200 bg-gray-100 px-2.5 py-1.5 text-gray-800  ${
                            open ? "bg-gray-100" : ""
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3 " />

                          <span>
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
                          <Popover.Panel className="absolute top-10 -right-5 z-20  transform overflow-hidden">
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
                              // minDate={startDateRange}

                              inline
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col gap-6 px-7 py-6">
                <div className="flex flex-col items-start justify-start gap-2 ">
                  <div className="flex items-center justify-start gap-2  ">
                    <h4 className="text-xl font-semibold text-gray-900">{module.name}</h4>
                    <CustomMenu width="lg" ellipsis>
                      <CustomMenu.MenuItem onClick={handleCopyText}>
                        <span className="flex items-center justify-start gap-2 text-gray-800">
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          <span>Copy Link</span>
                        </span>
                      </CustomMenu.MenuItem>
                      <CustomMenu.MenuItem onClick={() => setModuleDeleteModal(true)}>
                        <span className="flex items-center justify-start gap-2 text-gray-800">
                          <TrashIcon className="h-4 w-4" />
                          <span>Delete</span>
                        </span>
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>

                  <span className="whitespace-normal text-sm leading-5 text-black">
                    {module.description}
                  </span>
                </div>

                <div className="flex flex-col  gap-4  text-sm">
                  <Controller
                    control={control}
                    name="lead"
                    render={({ field: { value } }) => (
                      <SidebarLeadSelect
                        value={value}
                        onChange={(val: string) => {
                          submitChanges({ lead: value });
                        }}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="members_list"
                    render={({ field: { value } }) => (
                      <SidebarMembersSelect
                        value={value}
                        onChange={(val: string[]) => {
                          submitChanges({ members_list: val });
                        }}
                      />
                    )}
                  />

                  <div className="flex items-center justify-start gap-1">
                    <div className="flex w-40 items-center justify-start gap-2">
                      <ChartPieIcon className="h-5 w-5 text-gray-400" />
                      <span>Progress</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-800">
                      <span className="h-4 w-4">
                        <ProgressBar
                          value={groupedIssues.completed.length}
                          maxValue={moduleIssues?.length}
                        />
                      </span>
                      {groupedIssues.completed.length}/{moduleIssues?.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-gray-300 px-7 py-6 ">
              <Disclosure>
                {({ open }) => (
                  <div
                    className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2    ">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-gray-500">Progress</span>
                        {!open && moduleIssues ? (
                          <span className="rounded bg-[#09A953]/10 px-1.5 py-0.5 text-xs text-[#09A953]">
                            {Math.round(
                              (groupedIssues.completed.length / moduleIssues?.length) * 100
                            )}
                            %
                          </span>
                        ) : (
                          ""
                        )}
                      </div>

                      <Disclosure.Button>
                        <ChevronDownIcon
                          className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                          aria-hidden="true"
                        />
                      </Disclosure.Button>
                    </div>
                    <Transition show={open}>
                      <Disclosure.Panel>
                        {isStartValid && isEndValid && moduleIssues ? (
                          <div className=" h-full w-full py-4">
                            <div className="flex  items-start justify-between gap-4 py-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span>
                                  <DocumentIcon className="h-3 w-3 text-gray-500" />
                                </span>
                                <span>
                                  Pending Issues -{" "}
                                  {moduleIssues?.length - groupedIssues.completed.length}{" "}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-gray-900">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
                                  <span>Ideal</span>
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
                                  <span>Current</span>
                                </div>
                              </div>
                            </div>
                            <div className="relative h-40 w-96">
                              <ProgressChart
                                issues={issues}
                                start={module?.start_date ?? ""}
                                end={module?.target_date ?? ""}
                              />
                            </div>
                          </div>
                        ) : (
                          ""
                        )}
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
            </div>

            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-gray-300 px-7 py-6 ">
              <Disclosure>
                {({ open }) => (
                  <div
                    className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2    ">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-gray-500">Other Information</span>
                      </div>

                      <Disclosure.Button>
                        <ChevronDownIcon
                          className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                          aria-hidden="true"
                        />
                      </Disclosure.Button>
                    </div>
                    <Transition show={open}>
                      <Disclosure.Panel>
                        {issues.length > 0 ? (
                          <>
                            <div className=" h-full w-full py-4">
                              <SidebarProgressStats
                                issues={issues}
                                groupedIssues={groupedIssues}
                                setModuleLinkModal={setModuleLinkModal}
                                handleDeleteLink={handleDeleteLink}
                                userAuth={userAuth}
                                module={module}
                              />
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
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
