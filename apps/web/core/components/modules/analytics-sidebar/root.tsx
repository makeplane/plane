import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Info, SquareUser } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { MODULE_STATUS, EUserPermissions, EUserPermissionsLevel, EEstimateSystem } from "@plane/constants";
// plane types
import { useTranslation } from "@plane/i18n";
import {
  PlusIcon,
  MembersPropertyIcon,
  ModuleStatusIcon,
  WorkItemsIcon,
  StartDatePropertyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ILinkDetails, IModule, ModuleLink } from "@plane/types";
// plane ui
import { Loader, CustomSelect, TextArea } from "@plane/ui";
// components
// helpers
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { CreateUpdateModuleLinkModal, ModuleAnalyticsProgress, ModuleLinksList } from "@/components/modules";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions } from "@/hooks/store/user";
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
export const ModuleAnalyticsSidebar = observer(function ModuleAnalyticsSidebar(props: Props) {
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

  const submitChanges = async (data: Partial<IModule>) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), data);
  };

  const handleCreateLink = async (formData: ModuleLink) => {
    if (!workspaceSlug || !projectId || !moduleId) return;
    const payload = { metadata: {}, ...formData };
    await createModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), payload);
  };

  const handleUpdateLink = async (formData: ModuleLink, linkId: string) => {
    if (!workspaceSlug || !projectId) return;
    const payload = { metadata: {}, ...formData };
    await updateModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId, payload);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId) return;
    try {
      await deleteModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Module link deleted successfully.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Some error occurred",
      });
    }
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
        <div className={`sticky z-10 top-0 flex items-center justify-between bg-surface-1 pb-5 pt-5`}>
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-layer-3"
              onClick={() => handleClose()}
            >
              <ChevronRightIcon className="h-3 w-3 stroke-2 text-on-color" />
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
                      className={`flex h-6 w-20 items-center justify-center rounded-xs text-center text-11 ${
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
          <h4 className="w-full break-words text-18 font-semibold text-primary">{moduleDetails.name}</h4>
        </div>

        {moduleDetails.description && (
          <TextArea
            className="outline-none ring-none w-full max-h-max bg-transparent !p-0 !m-0 !border-0 resize-none text-13 leading-5 text-secondary"
            value={moduleDetails.description}
            disabled
          />
        )}

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-tertiary">
              <StartDatePropertyIcon className="h-4 w-4" />
              <span className="text-14">{t("date_range")}</span>
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
            <div className="flex w-2/5 items-center justify-start gap-2 text-tertiary">
              <SquareUser className="h-4 w-4" />
              <span className="text-14">{t("lead")}</span>
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
            <div className="flex w-2/5 items-center justify-start gap-2 text-tertiary">
              <MembersPropertyIcon className="h-4 w-4" />
              <span className="text-14">{t("members")}</span>
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
            <div className="flex w-2/5 items-center justify-start gap-2 text-tertiary">
              <WorkItemsIcon className="h-4 w-4" />
              <span className="text-14">{t("issues")}</span>
            </div>
            <div className="flex h-7 w-3/5 items-center">
              <span className="px-1.5 text-13 text-tertiary">{issueCount}</span>
            </div>
          </div>

          {/**
           * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
           */}
          {isEstimatePointValid && (
            <div className="flex items-center justify-start gap-1">
              <div className="flex w-2/5 items-center justify-start gap-2 text-tertiary">
                <WorkItemsIcon className="h-4 w-4" />
                <span className="text-14">{t("points")}</span>
              </div>
              <div className="flex h-7 w-3/5 items-center">
                <span className="px-1.5 text-13 text-tertiary">{issueEstimatePointCount}</span>
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
          <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-subtle px-1.5 py-5">
            {/* Accessing link outside the disclosure as mobx is not  considering the children inside Disclosure as part of the component hence not observing their state change*/}
            <Disclosure defaultOpen={!!moduleDetails?.link_module?.length}>
              {({ open }) => (
                <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                  <Disclosure.Button className="flex w-full items-center justify-between gap-2 p-1.5">
                    <div className="flex items-center justify-start gap-2 text-13">
                      <span className="font-medium text-secondary">{t("common.links")}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ChevronDownIcon
                        className={`h-3.5 w-3.5 ${open ? "rotate-180 transform" : ""}`}
                        aria-hidden="true"
                      />
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
                                  className="flex items-center gap-1.5 text-13 font-medium text-accent-primary"
                                  onClick={() => setModuleLinkModal(true)}
                                >
                                  <PlusIcon className="h-3 w-3" />
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
                              <Info className="h-3.5 w-3.5 stroke-[1.5] text-tertiary" />
                              <span className="p-0.5 text-11 text-tertiary">{t("common.no_links_added_yet")}</span>
                            </div>
                            {isEditingAllowed && !isArchived && (
                              <button
                                className="flex items-center gap-1.5 text-13 font-medium text-accent-primary"
                                onClick={() => setModuleLinkModal(true)}
                              >
                                <PlusIcon className="h-3 w-3" />
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
