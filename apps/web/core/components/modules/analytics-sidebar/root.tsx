"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CalendarClock, ChevronDown, ChevronRight, Info, Plus, SquareUser, Users } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import {
  MODULE_STATUS,
  EUserPermissions,
  EUserPermissionsLevel,
  EEstimateSystem,
  MODULE_TRACKER_EVENTS,
  MODULE_TRACKER_ELEMENTS,
} from "@plane/constants";
// plane types
import { useTranslation } from "@plane/i18n";
import { ILinkDetails, IModule, ModuleLink } from "@plane/types";
// plane ui
import { Loader, LayersIcon, CustomSelect, ModuleStatusIcon, TOAST_TYPE, setToast, TextArea } from "@plane/ui";
// components
// helpers
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateRangeDropdown, MemberDropdown } from "@/components/dropdowns";
import { CreateUpdateModuleLinkModal, ModuleAnalyticsProgress, ModuleLinksList } from "@/components/modules";
import { captureElementAndEvent, captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useModule, useProjectEstimates, useUserPermissions } from "@/hooks/store";
// plane web constants
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
export const ModuleAnalyticsSidebar: React.FC<Props> = observer((props) => {
  const { moduleId, handleClose, isArchived } = props;
  // states
  const [moduleLinkModal, setModuleLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<ILinkDetails | null>(null);
  // router
  const { workspaceSlug, projectId } = useParams();

  // store hooks
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();

  const { getModuleById, updateModuleDetails, createModuleLink, updateModuleLink, deleteModuleLink } = useModule();
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();

  // derived values
  const moduleDetails = getModuleById(moduleId);
  const areEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId.toString());
  const estimateType = areEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const isEstimatePointValid = estimateType && estimateType?.type == EEstimateSystem.POINTS ? true : false;

  const { reset, control } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), data)
      .then((res) => {
        captureElementAndEvent({
          element: {
            elementName: MODULE_TRACKER_ELEMENTS.RIGHT_SIDEBAR,
          },
          event: {
            eventName: MODULE_TRACKER_EVENTS.update,
            payload: { id: res.id },
            state: "SUCCESS",
          },
        });
      })
      .catch((error) => {
        captureError({
          eventName: MODULE_TRACKER_EVENTS.update,
          payload: { id: moduleId },
          error,
        });
      });
  };

  const handleCreateLink = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const payload = { metadata: {}, ...formData };

    await createModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), payload)
      .then(() =>
        captureSuccess({
          eventName: MODULE_TRACKER_EVENTS.link.create,
          payload: { id: moduleId },
        })
      )
      .catch((error) => {
        captureError({
          eventName: MODULE_TRACKER_EVENTS.link.create,
          payload: { id: moduleId },
          error,
        });
      });
  };

  const handleUpdateLink = async (formData: ModuleLink, linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    const payload = { metadata: {}, ...formData };

    await updateModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId, payload)
      .then(() =>
        captureSuccess({
          eventName: MODULE_TRACKER_EVENTS.link.update,
          payload: { id: moduleId },
        })
      )
      .catch((error) => {
        captureError({
          eventName: MODULE_TRACKER_EVENTS.link.update,
          payload: { id: moduleId },
          error,
        });
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !module) return;

    deleteModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId)
      .then(() => {
        captureSuccess({
          eventName: MODULE_TRACKER_EVENTS.link.delete,
          payload: { id: moduleId },
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
        captureError({
          eventName: MODULE_TRACKER_EVENTS.link.delete,
          payload: { id: moduleId },
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

  useEffect(() => {
    if (moduleDetails)
      reset({
        ...moduleDetails,
      });
  }, [moduleDetails, reset]);

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
    moduleDetails.total_issues === 0
      ? "0 work items"
      : `${moduleDetails.completed_issues}/${moduleDetails.total_issues}`;

  const issueEstimatePointCount =
    moduleDetails.total_estimate_points === 0
      ? "0 work items"
      : `${moduleDetails.completed_estimate_points}/${moduleDetails.total_estimate_points}`;

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="relative">
      <CreateUpdateModuleLinkModal
        isOpen={moduleLinkModal}
        handleClose={() => {
          setModuleLinkModal(false);
          setTimeout(() => {
            setSelectedLinkToUpdate(null);
          }, 500);
        }}
        data={selectedLinkToUpdate}
        createLink={handleCreateLink}
        updateLink={handleUpdateLink}
      />
      <>
        <div
          className={`sticky z-10 top-0 flex items-center justify-between bg-custom-sidebar-background-100 pb-5 pt-5`}
        >
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-border-300"
              onClick={() => handleClose()}
            >
              <ChevronRight className="h-3 w-3 stroke-2 text-white" />
            </button>
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
                      {(moduleStatus && t(moduleStatus?.i18n_label)) ?? t("project_modules.status.backlog")}
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
                        {t(status.i18n_label)}
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

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <CalendarClock className="h-4 w-4" />
              <span className="text-base">{t("date_range")}</span>
            </div>
            <div className="h-7">
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
                            from: t("start_date"),
                            to: t("end_date"),
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
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <SquareUser className="h-4 w-4" />
              <span className="text-base">{t("lead")}</span>
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
                    placeholder={t("lead")}
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
              <span className="text-base">{t("members")}</span>
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
              <span className="text-base">{t("issues")}</span>
            </div>
            <div className="flex h-7 w-3/5 items-center">
              <span className="px-1.5 text-sm text-custom-text-300">{issueCount}</span>
            </div>
          </div>

          {/**
           * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
           */}
          {isEstimatePointValid && (
            <div className="flex items-center justify-start gap-1">
              <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
                <LayersIcon className="h-4 w-4" />
                <span className="text-base">{t("points")}</span>
              </div>
              <div className="flex h-7 w-3/5 items-center">
                <span className="px-1.5 text-sm text-custom-text-300">{issueEstimatePointCount}</span>
              </div>
            </div>
          )}
        </div>

        {workspaceSlug && projectId && moduleDetails?.id && (
          <ModuleAnalyticsProgress
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            moduleId={moduleDetails?.id}
          />
        )}

        <div className="flex flex-col">
          <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 px-1.5 py-5">
            {/* Accessing link outside the disclosure as mobx is not  considering the children inside Disclosure as part of the component hence not observing their state change*/}
            <Disclosure defaultOpen={!!moduleDetails?.link_module?.length}>
              {({ open }) => (
                <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                  <Disclosure.Button className="flex w-full items-center justify-between gap-2 p-1.5">
                    <div className="flex items-center justify-start gap-2 text-sm">
                      <span className="font-medium text-custom-text-200">{t("common.links")}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <ChevronDown className={`h-3.5 w-3.5 ${open ? "rotate-180 transform" : ""}`} aria-hidden="true" />
                    </div>
                  </Disclosure.Button>
                  <Transition show={open}>
                    <Disclosure.Panel>
                      <div className="mt-2 flex min-h-72 w-full flex-col space-y-3 overflow-y-auto">
                        {isEditingAllowed && moduleDetails.link_module && moduleDetails.link_module.length > 0 ? (
                          <>
                            {isEditingAllowed && !isArchived && (
                              <div className="flex w-full items-center justify-end">
                                <button
                                  className="flex items-center gap-1.5 text-sm font-medium text-custom-primary-100"
                                  onClick={() => setModuleLinkModal(true)}
                                >
                                  <Plus className="h-3 w-3" />
                                  {t("add_link")}
                                </button>
                              </div>
                            )}

                            {moduleId && (
                              <ModuleLinksList
                                moduleId={moduleId}
                                handleEditLink={handleEditLink}
                                handleDeleteLink={handleDeleteLink}
                                disabled={!isEditingAllowed || isArchived}
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                              <span className="p-0.5 text-xs text-custom-text-300">
                                {t("common.no_links_added_yet")}
                              </span>
                            </div>
                            {isEditingAllowed && !isArchived && (
                              <button
                                className="flex items-center gap-1.5 text-sm font-medium text-custom-primary-100"
                                onClick={() => setModuleLinkModal(true)}
                              >
                                <Plus className="h-3 w-3" />
                                {t("add_link")}
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
