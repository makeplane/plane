import React, { useCallback, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import {
  AlertCircle,
  ArchiveRestoreIcon,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Info,
  LinkIcon,
  Plus,
  SquareUser,
  Trash2,
  Users,
} from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { IIssueFilterOptions, ILinkDetails, IModule, ModuleLink } from "@plane/types";
// ui
import {
  CustomMenu,
  Loader,
  LayersIcon,
  CustomSelect,
  ModuleStatusIcon,
  TOAST_TYPE,
  setToast,
  ArchiveIcon,
  TextArea,
} from "@plane/ui";
// components
import { LinkModal, LinksList, SidebarProgressStats } from "@/components/core";
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { DateRangeDropdown, MemberDropdown } from "@/components/dropdowns";
import { ArchiveModuleModal, DeleteModuleModal } from "@/components/modules";
// constant
import {
  MODULE_LINK_CREATED,
  MODULE_LINK_DELETED,
  MODULE_LINK_UPDATED,
  MODULE_UPDATED,
} from "@/constants/event-tracker";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { MODULE_STATUS } from "@/constants/module";
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useModule, useUser, useEventTracker, useIssues } from "@/hooks/store";
// types

const defaultValues: Partial<IModule> = {
  lead_id: "",
  member_ids: [],
  start_date: null,
  target_date: null,
  status: "backlog",
};

type Props = {
  moduleId: string;
  handleClose: () => void;
  isArchived?: boolean;
};

// TODO: refactor this component
export const ModuleDetailsSidebar: React.FC<Props> = observer((props) => {
  const { moduleId, handleClose, isArchived } = props;
  // states
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);
  const [archiveModuleModal, setArchiveModuleModal] = useState(false);
  const [moduleLinkModal, setModuleLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<ILinkDetails | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getModuleById, updateModuleDetails, createModuleLink, updateModuleLink, deleteModuleLink, restoreModule } =
    useModule();
  const { setTrackElement, captureModuleEvent, captureEvent } = useEventTracker();
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  const moduleDetails = getModuleById(moduleId);

  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  const { reset, control } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), data)
      .then((res) => {
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...res, changed_properties: Object.keys(data)[0], element: "Right side-peek", state: "SUCCESS" },
        });
      })
      .catch(() => {
        captureModuleEvent({
          eventName: MODULE_UPDATED,
          payload: { ...data, state: "FAILED" },
        });
      });
  };

  const handleCreateLink = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const payload = { metadata: {}, ...formData };

    createModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), payload)
      .then(() => {
        captureEvent(MODULE_LINK_CREATED, {
          module_id: moduleId,
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module link created successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
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
        captureEvent(MODULE_LINK_UPDATED, {
          module_id: moduleId,
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module link updated successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    deleteModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId)
      .then(() => {
        captureEvent(MODULE_LINK_DELETED, {
          module_id: moduleId,
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module link deleted successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${moduleId}`)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Link copied",
          message: "Module link copied to clipboard",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Some error occurred",
        });
      });
  };

  const handleDateChange = async (startDate: Date | undefined, targetDate: Date | undefined) => {
    submitChanges({
      start_date: startDate ? renderFormattedPayloadDate(startDate) : null,
      target_date: targetDate ? renderFormattedPayloadDate(targetDate) : null,
    });
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Success!",
      message: "Module updated successfully.",
    });
  };

  const handleRestoreModule = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!workspaceSlug || !projectId || !moduleId) return;

    await restoreModule(workspaceSlug.toString(), projectId.toString(), moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your module can be found in project modules.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/archives/modules`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Module could not be restored. Please try again.",
        })
      );
  };

  useEffect(() => {
    if (moduleDetails)
      reset({
        ...moduleDetails,
      });
  }, [moduleDetails, reset]);

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      let newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        if (key === "state") {
          if (isEqual(newValues, value)) newValues = [];
          else newValues = value;
        } else {
          value.forEach((val) => {
            if (!newValues.includes(val)) newValues.push(val);
            else newValues.splice(newValues.indexOf(val), 1);
          });
        }
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        moduleId
      );
    },
    [workspaceSlug, projectId, moduleId, issueFilters, updateFilters]
  );

  const startDate = getDate(moduleDetails?.start_date);
  const endDate = getDate(moduleDetails?.target_date);
  const isStartValid = startDate && startDate <= new Date();
  const isEndValid = startDate && endDate && endDate >= startDate;

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

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const issueCount =
    moduleDetails.total_issues === 0 ? "0 Issue" : `${moduleDetails.completed_issues}/${moduleDetails.total_issues}`;

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <div className="relative">
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
      {workspaceSlug && projectId && (
        <ArchiveModuleModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          moduleId={moduleId}
          isOpen={archiveModuleModal}
          handleClose={() => setArchiveModuleModal(false)}
        />
      )}
      <DeleteModuleModal isOpen={moduleDeleteModal} onClose={() => setModuleDeleteModal(false)} data={moduleDetails} />
      <>
        <div className="sticky z-10 top-0 flex items-center justify-between bg-custom-sidebar-background-100 py-5">
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-border-300"
              onClick={() => handleClose()}
            >
              <ChevronRight className="h-3 w-3 stroke-2 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            {!isArchived && (
              <button onClick={handleCopyText}>
                <LinkIcon className="h-3 w-3 text-custom-text-300" />
              </button>
            )}
            {isEditingAllowed && (
              <CustomMenu placement="bottom-end" ellipsis>
                {!isArchived && (
                  <CustomMenu.MenuItem onClick={() => setArchiveModuleModal(true)} disabled={!isInArchivableGroup}>
                    {isInArchivableGroup ? (
                      <div className="flex items-center gap-2">
                        <ArchiveIcon className="h-3 w-3" />
                        Archive module
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <ArchiveIcon className="h-3 w-3" />
                        <div className="-mt-1">
                          <p>Archive module</p>
                          <p className="text-xs text-custom-text-400">
                            Only completed or cancelled <br /> module can be archived.
                          </p>
                        </div>
                      </div>
                    )}
                  </CustomMenu.MenuItem>
                )}
                {isArchived && (
                  <CustomMenu.MenuItem onClick={handleRestoreModule}>
                    <span className="flex items-center justify-start gap-2">
                      <ArchiveRestoreIcon className="h-3 w-3" />
                      <span>Restore module</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem
                  onClick={() => {
                    setTrackElement("Module peek-overview");
                    setModuleDeleteModal(true);
                  }}
                >
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
                        isEditingAllowed && !isArchived ? "cursor-pointer" : "cursor-not-allowed"
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
                  disabled={!isEditingAllowed || isArchived}
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
          <TextArea
            className="outline-none ring-none w-full max-h-max bg-transparent !p-0 !m-0 !border-0 resize-none text-sm leading-5 text-custom-text-200"
            value={moduleDetails.description}
            disabled
          />
        )}

        <div className="flex items-center justify-start gap-1">
          <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
            <CalendarClock className="h-4 w-4" />
            <span className="text-base">Date range</span>
          </div>
          <div className="h-7 w-3/5">
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => {
                    const startDate = getDate(startDateValue);
                    const endDate = getDate(endDateValue);
                    return (
                      <DateRangeDropdown
                        buttonContainerClassName="w-full"
                        buttonVariant="background-with-text"
                        value={{
                          from: startDate,
                          to: endDate,
                        }}
                        onSelect={(val) => {
                          onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                          onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                          handleDateChange(val?.from, val?.to);
                        }}
                        placeholder={{
                          from: "Start date",
                          to: "Target date",
                        }}
                        disabled={!isEditingAllowed || isArchived}
                      />
                    );
                  }}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <SquareUser className="h-4 w-4" />
              <span className="text-base">Lead</span>
            </div>
            <Controller
              control={control}
              name="lead_id"
              render={({ field: { value } }) => (
                <div className="h-7 w-3/5">
                  <MemberDropdown
                    value={value ?? null}
                    onChange={(val) => {
                      submitChanges({ lead_id: val });
                    }}
                    projectId={projectId?.toString() ?? ""}
                    multiple={false}
                    buttonVariant="background-with-text"
                    placeholder="Lead"
                    disabled={!isEditingAllowed || isArchived}
                    icon={SquareUser}
                  />
                </div>
              )}
            />
          </div>
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <Users className="h-4 w-4" />
              <span className="text-base">Members</span>
            </div>
            <Controller
              control={control}
              name="member_ids"
              render={({ field: { value } }) => (
                <div className="h-7 w-3/5">
                  <MemberDropdown
                    value={value ?? []}
                    onChange={(val: string[]) => {
                      submitChanges({ member_ids: val });
                    }}
                    multiple
                    projectId={projectId?.toString() ?? ""}
                    buttonVariant={value && value?.length > 0 ? "transparent-without-text" : "background-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    disabled={!isEditingAllowed || isArchived}
                  />
                </div>
              )}
            />
          </div>
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <LayersIcon className="h-4 w-4" />
              <span className="text-base">Issues</span>
            </div>
            <div className="flex h-7 w-3/5 items-center">
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
                        {moduleDetails.start_date && moduleDetails.target_date ? (
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
                            <div className="relative h-40 w-full max-w-80">
                              <ProgressChart
                                distribution={moduleDetails.distribution?.completion_chart ?? {}}
                                startDate={moduleDetails.start_date}
                                endDate={moduleDetails.target_date}
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
                              filters={issueFilters}
                              handleFiltersUpdate={handleFiltersUpdate}
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
            {/* Accessing link outside the disclosure as mobx is not  considering the children inside Disclosure as part of the component hence not observing their state change*/}
            <Disclosure defaultOpen={!!moduleDetails?.link_module?.length}>
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
                            {isEditingAllowed && !isArchived && (
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

                            {moduleId && (
                              <LinksList
                                moduleId={moduleId}
                                handleEditLink={handleEditLink}
                                handleDeleteLink={handleDeleteLink}
                                userAuth={{
                                  isGuest: currentProjectRole === EUserProjectRoles.GUEST,
                                  isViewer: currentProjectRole === EUserProjectRoles.VIEWER,
                                  isMember: currentProjectRole === EUserProjectRoles.MEMBER,
                                  isOwner: currentProjectRole === EUserProjectRoles.ADMIN,
                                }}
                                disabled={isArchived}
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                              <span className="p-0.5 text-xs text-custom-text-300">No links added yet</span>
                            </div>
                            {isEditingAllowed && !isArchived && (
                              <button
                                className="flex items-center gap-1.5 text-sm font-medium text-custom-primary-100"
                                onClick={() => setModuleLinkModal(true)}
                              >
                                <Plus className="h-3 w-3" />
                                Add link
                              </button>
                            )}
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
    </div>
  );
});
