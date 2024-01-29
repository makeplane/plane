import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { Disclosure, Popover, Transition } from "@headlessui/react";
import {
  AlertCircle,
  CalendarCheck2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Info,
  LinkIcon,
  Plus,
  Trash2,
  UserCircle2,
} from "lucide-react";
// hooks
import { useModule, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { LinkModal, LinksList, SidebarProgressStats } from "components/core";
import { DeleteModuleModal } from "components/modules";
import ProgressChart from "components/core/sidebar/progress-chart";
import { ProjectMemberDropdown } from "components/dropdowns";
// ui
import { CustomRangeDatePicker } from "components/ui";
import { CustomMenu, Loader, LayersIcon, CustomSelect, ModuleStatusIcon, UserGroupIcon } from "@plane/ui";
// helpers
import { isDateGreaterThanToday, renderFormattedPayloadDate, renderFormattedDate } from "helpers/date-time.helper";
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { ILinkDetails, IModule, ModuleLink } from "@plane/types";
// constant
import { MODULE_STATUS } from "constants/module";
import { EUserProjectRoles } from "constants/project";

const defaultValues: Partial<IModule> = {
  lead: "",
  members: [],
  start_date: null,
  target_date: null,
  status: "backlog",
};

type Props = {
  moduleId: string;
  handleClose: () => void;
};

// TODO: refactor this component
export const ModuleDetailsSidebar: React.FC<Props> = observer((props) => {
  const { moduleId, handleClose } = props;
  // states
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [moduleLinkModal, setModuleLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<ILinkDetails | null>(null);
  // refs
  const startDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const endDateButtonRef = useRef<HTMLButtonElement | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getModuleById, updateModuleDetails, createModuleLink, updateModuleLink, deleteModuleLink } = useModule();

  const moduleDetails = getModuleById(moduleId);

  const { setToastAlert } = useToast();

  const { setValue, watch, reset, control } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), data);
  };

  const handleCreateLink = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const payload = { metadata: {}, ...formData };

    createModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Module link created",
          message: "Module link created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleUpdateLink = async (formData: ModuleLink, linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    const payload = { metadata: {}, ...formData };

    updateModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId, payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Module link updated",
          message: "Module link updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    deleteModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Module link deleted",
          message: "Module link deleted successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${moduleId}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Link copied",
          message: "Module link copied to clipboard",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleStartDateChange = async (date: string) => {
    setValue("start_date", date);

    if (!watch("target_date") || watch("target_date") === "") endDateButtonRef.current?.click();

    if (watch("start_date") && watch("target_date") && watch("start_date") !== "" && watch("start_date") !== "") {
      if (!isDateGreaterThanToday(`${watch("target_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create module in past date. Please enter a valid date.",
        });
        reset({
          ...moduleDetails,
        });
        return;
      }

      submitChanges({
        start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
        target_date: renderFormattedPayloadDate(`${watch("target_date")}`),
      });
      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Module updated successfully.",
      });
    }
  };

  const handleEndDateChange = async (date: string) => {
    setValue("target_date", date);

    if (!watch("start_date") || watch("start_date") === "") endDateButtonRef.current?.click();

    if (watch("start_date") && watch("target_date") && watch("start_date") !== "" && watch("start_date") !== "") {
      if (!isDateGreaterThanToday(`${watch("target_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create module in past date. Please enter a valid date.",
        });
        reset({
          ...moduleDetails,
        });
        return;
      }

      submitChanges({
        start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
        target_date: renderFormattedPayloadDate(`${watch("target_date")}`),
      });
      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Module updated successfully.",
      });
    }
  };

  useEffect(() => {
    if (moduleDetails)
      reset({
        ...moduleDetails,
      });
  }, [moduleDetails, reset]);

  const isStartValid = new Date(`${moduleDetails?.start_date}`) <= new Date();
  const isEndValid = new Date(`${moduleDetails?.target_date}`) >= new Date(`${moduleDetails?.start_date}`);

  const progressPercentage = moduleDetails
    ? Math.round((moduleDetails.completed_issues / moduleDetails.total_issues) * 100)
    : null;

  const handleEditLink = (link: ILinkDetails) => {
    setSelectedLinkToUpdate(link);
    setModuleLinkModal(true);
  };

  if (!moduleDetails)
    return (
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
    );

  const startDate = new Date(watch("start_date") ?? moduleDetails.start_date ?? "");
  const endDate = new Date(watch("target_date") ?? moduleDetails.target_date ?? "");

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const issueCount =
    moduleDetails.total_issues === 0
      ? "0 Issue"
      : moduleDetails.total_issues === moduleDetails.completed_issues
      ? moduleDetails.total_issues > 1
        ? `${moduleDetails.total_issues}`
        : `${moduleDetails.total_issues}`
      : `${moduleDetails.completed_issues}/${moduleDetails.total_issues}`;

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <>
      <LinkModal
        isOpen={moduleLinkModal}
        handleClose={() => {
          setModuleLinkModal(false);
          setSelectedLinkToUpdate(null);
        }}
        data={selectedLinkToUpdate}
        status={selectedLinkToUpdate ? true : false}
        createIssueLink={handleCreateLink}
        updateIssueLink={handleUpdateLink}
      />
      <DeleteModuleModal isOpen={moduleDeleteModal} onClose={() => setModuleDeleteModal(false)} data={moduleDetails} />

      <>
        <div className="flex w-full items-center justify-between">
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-border-300"
              onClick={() => handleClose()}
            >
              <ChevronRight className="h-3 w-3 stroke-2 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            <button onClick={handleCopyText}>
              <LinkIcon className="h-3 w-3 text-custom-text-300" />
            </button>
            {isEditingAllowed && (
              <CustomMenu placement="bottom-end" ellipsis>
                <CustomMenu.MenuItem onClick={() => setModuleDeleteModal(true)}>
                  <span className="flex items-center justify-start gap-2">
                    <Trash2 className="h-3 w-3" />
                    <span>Delete module</span>
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-5 pt-2">
            <Controller
              control={control}
              name="status"
              render={({ field: { value } }) => (
                <CustomSelect
                  customButton={
                    <span
                      className={`flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs ${
                        isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      style={{
                        color: moduleStatus ? moduleStatus.color : "#a3a3a2",
                        backgroundColor: moduleStatus ? `${moduleStatus.color}20` : "#a3a3a220",
                      }}
                    >
                      {moduleStatus?.label ?? "Backlog"}
                    </span>
                  }
                  value={value}
                  onChange={(value: any) => {
                    submitChanges({ status: value });
                  }}
                  disabled={!isEditingAllowed}
                >
                  {MODULE_STATUS.map((status) => (
                    <CustomSelect.Option key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <ModuleStatusIcon status={status.value} />
                        {status.label}
                      </div>
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          </div>
          <h4 className="w-full break-words text-xl font-semibold text-custom-text-100">{moduleDetails.name}</h4>
        </div>

        {moduleDetails.description && (
          <span className="w-full whitespace-normal break-words py-2.5 text-sm leading-5 text-custom-text-200">
            {moduleDetails.description}
          </span>
        )}

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <CalendarClock className="h-4 w-4" />

              <span className="text-base">Start date</span>
            </div>
            <div className="relative flex w-1/2 items-center rounded-sm">
              <Popover className="flex h-full w-full items-center justify-center rounded-lg">
                {({ close }) => (
                  <>
                    <Popover.Button
                      ref={startDateButtonRef}
                      className={`w-full cursor-pointer rounded-sm text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 ${
                        isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      disabled={!isEditingAllowed}
                    >
                      <span
                        className={`group flex w-full items-center justify-between gap-2 px-1.5 py-1 text-sm ${
                          watch("start_date") ? "" : "text-custom-text-400"
                        }`}
                      >
                        {renderFormattedDate(startDate) ?? "No date selected"}
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
                      <Popover.Panel className="absolute right-0 top-10 z-20  transform overflow-hidden">
                        <CustomRangeDatePicker
                          value={watch("start_date") ? watch("start_date") : moduleDetails?.start_date}
                          onChange={(val) => {
                            if (val) {
                              handleStartDateChange(val);
                              close();
                            }
                          }}
                          startDate={watch("start_date") ?? watch("target_date") ?? null}
                          endDate={watch("target_date") ?? watch("start_date") ?? null}
                          maxDate={new Date(`${watch("target_date")}`)}
                          selectsStart={watch("target_date") ? true : false}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <CalendarCheck2 className="h-4 w-4" />
              <span className="text-base">Target date</span>
            </div>
            <div className="relative flex w-1/2 items-center rounded-sm">
              <Popover className="flex h-full w-full items-center justify-center rounded-lg">
                {({ close }) => (
                  <>
                    <Popover.Button
                      ref={endDateButtonRef}
                      className={`w-full cursor-pointer rounded-sm text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 ${
                        isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      disabled={!isEditingAllowed}
                    >
                      <span
                        className={`group flex w-full items-center justify-between gap-2 px-1.5 py-1 text-sm ${
                          watch("target_date") ? "" : "text-custom-text-400"
                        }`}
                      >
                        {renderFormattedDate(endDate) ?? "No date selected"}
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
                      <Popover.Panel className="absolute right-0 top-10 z-20 transform overflow-hidden">
                        <CustomRangeDatePicker
                          value={watch("target_date") ? watch("target_date") : moduleDetails?.target_date}
                          onChange={(val) => {
                            if (val) {
                              handleEndDateChange(val);
                              close();
                            }
                          }}
                          startDate={watch("start_date") ?? watch("target_date") ?? null}
                          endDate={watch("target_date") ?? watch("start_date") ?? null}
                          minDate={new Date(`${watch("start_date")}`)}
                          selectsEnd={watch("start_date") ? true : false}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>
        </div>

        {moduleDetails.description && (
          <span className="w-full whitespace-normal break-words py-2.5 text-sm leading-5 text-custom-text-200">
            {moduleDetails.description}
          </span>
        )}

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <UserCircle2 className="h-4 w-4" />
              <span className="text-base">Lead</span>
            </div>
            <Controller
              control={control}
              name="lead"
              render={({ field: { value } }) => (
                <div className="w-1/2">
                  <ProjectMemberDropdown
                    value={value ?? null}
                    onChange={(val) => {
                      submitChanges({ lead: val });
                    }}
                    projectId={projectId?.toString() ?? ""}
                    multiple={false}
                    buttonVariant="background-with-text"
                    placeholder="Lead"
                  />
                </div>
              )}
            />
          </div>
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <UserGroupIcon className="h-4 w-4" />
              <span className="text-base">Members</span>
            </div>
            <Controller
              control={control}
              name="members"
              render={({ field: { value } }) => (
                <div className="w-1/2">
                  <ProjectMemberDropdown
                    value={value ?? []}
                    onChange={(val: string[]) => {
                      submitChanges({ members: val });
                    }}
                    multiple
                    projectId={projectId?.toString() ?? ""}
                    buttonVariant={value && value?.length > 0 ? "transparent-without-text" : "background-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    disabled={!isEditingAllowed}
                  />
                </div>
              )}
            />
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <LayersIcon className="h-4 w-4" />
              <span className="text-base">Issues</span>
            </div>
            <div className="flex w-1/2 items-center">
              <span className="px-1.5 text-sm text-custom-text-300">{issueCount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 px-1.5 py-5">
            <Disclosure defaultOpen>
              {({ open }) => (
                <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                  <Disclosure.Button
                    className="flex w-full items-center justify-between gap-2 p-1.5"
                    disabled={!isStartValid || !isEndValid}
                  >
                    <div className="flex items-center justify-start gap-2 text-sm">
                      <span className="font-medium text-custom-text-200">Progress</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {progressPercentage ? (
                        <span className="flex h-5 w-9 items-center justify-center rounded bg-amber-500/20 text-xs font-medium text-amber-500">
                          {progressPercentage ? `${progressPercentage}%` : ""}
                        </span>
                      ) : (
                        ""
                      )}
                      {isStartValid && isEndValid ? (
                        <ChevronDown className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`} aria-hidden="true" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle height={14} width={14} className="text-custom-text-200" />
                          <span className="text-xs italic text-custom-text-200">
                            {moduleDetails?.start_date && moduleDetails?.target_date
                              ? "This module isn't active yet."
                              : "Invalid date. Please enter valid date."}
                          </span>
                        </div>
                      )}
                    </div>
                  </Disclosure.Button>
                  <Transition show={open}>
                    <Disclosure.Panel>
                      <div className="flex flex-col gap-3">
                        {isStartValid && isEndValid ? (
                          <div className=" h-full w-full pt-4">
                            <div className="flex  items-start  gap-4 py-2 text-xs">
                              <div className="flex items-center gap-3 text-custom-text-100">
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
                            <div className="relative h-40 w-80">
                              <ProgressChart
                                distribution={moduleDetails.distribution?.completion_chart}
                                startDate={moduleDetails.start_date ?? ""}
                                endDate={moduleDetails.target_date ?? ""}
                                totalIssues={moduleDetails.total_issues}
                              />
                            </div>
                          </div>
                        ) : (
                          ""
                        )}
                        {moduleDetails.total_issues > 0 && (
                          <div className="h-full w-full border-t border-custom-border-200 pt-5">
                            <SidebarProgressStats
                              distribution={moduleDetails.distribution}
                              groupedIssues={{
                                backlog: moduleDetails.backlog_issues,
                                unstarted: moduleDetails.unstarted_issues,
                                started: moduleDetails.started_issues,
                                completed: moduleDetails.completed_issues,
                                cancelled: moduleDetails.cancelled_issues,
                              }}
                              totalIssues={moduleDetails.total_issues}
                              module={moduleDetails}
                              isPeekView={Boolean(peekModule)}
                            />
                          </div>
                        )}
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>

          <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 px-1.5 py-5">
            <Disclosure>
              {({ open }) => (
                <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                  <Disclosure.Button className="flex w-full items-center justify-between gap-2 p-1.5">
                    <div className="flex items-center justify-start gap-2 text-sm">
                      <span className="font-medium text-custom-text-200">Links</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <ChevronDown className={`h-3.5 w-3.5 ${open ? "rotate-180 transform" : ""}`} aria-hidden="true" />
                    </div>
                  </Disclosure.Button>
                  <Transition show={open}>
                    <Disclosure.Panel>
                      <div className="mt-2 flex h-72 w-full flex-col space-y-3 overflow-y-auto">
                        {currentProjectRole && moduleDetails.link_module && moduleDetails.link_module.length > 0 ? (
                          <>
                            {isEditingAllowed && (
                              <div className="flex w-full items-center justify-end">
                                <button
                                  className="flex items-center gap-1.5 text-sm font-medium text-custom-primary-100"
                                  onClick={() => setModuleLinkModal(true)}
                                >
                                  <Plus className="h-3 w-3" />
                                  Add link
                                </button>
                              </div>
                            )}

                            <LinksList
                              links={moduleDetails.link_module}
                              handleEditLink={handleEditLink}
                              handleDeleteLink={handleDeleteLink}
                              userAuth={{
                                isGuest: currentProjectRole === EUserProjectRoles.GUEST,
                                isViewer: currentProjectRole === EUserProjectRoles.VIEWER,
                                isMember: currentProjectRole === EUserProjectRoles.MEMBER,
                                isOwner: currentProjectRole === EUserProjectRoles.ADMIN,
                              }}
                            />
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                              <span className="p-0.5 text-xs text-custom-text-300">No links added yet</span>
                            </div>
                            <button
                              className="flex items-center gap-1.5 text-sm font-medium text-custom-primary-100"
                              onClick={() => setModuleLinkModal(true)}
                            >
                              <Plus className="h-3 w-3" />
                              Add link
                            </button>
                          </div>
                        )}
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>
        </div>
      </>
    </>
  );
});
