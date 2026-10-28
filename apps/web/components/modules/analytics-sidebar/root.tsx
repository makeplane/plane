/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  AddOutline,
  CloseOutline,
  LeadOutline,
  MembersOutline,
  StartDateOutline,
  StateOutline,
  WorkItemsOutline,
} from "@makeplane/propel/icons";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { MODULE_STATUS, EUserPermissions, EUserPermissionsLevel, EEstimateSystem } from "@plane/constants";
// plane types
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import { setToast } from "@plane/blocks/toast";
import type { ILinkDetails, IModule, ModuleLink } from "@plane/types";
// plane ui
import { DateRangeSelect } from "@plane/blocks/property-select";
import { Loader } from "@plane/blocks/skeleton";
// components
// helpers
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { CreateUpdateModuleLinkModal, ModuleAnalyticsProgress, ModuleLinksList } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
import { ModuleQuickActions } from "@/components/modules/quick-actions";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions, useUserProfile } from "@/hooks/store/user";
// local imports
import { ModuleSidebarDescription } from "./description";

const defaultValues: Partial<IModule> = {
  lead_id: "",
  member_ids: [],
  start_date: null,
  target_date: null,
  status: "backlog",
};

type TModuleLinksCollapsibleProps = {
  moduleDetails: IModule;
  moduleId: string;
  isEditingAllowed: boolean;
  isArchived: boolean;
  handleEditLink: (link: ILinkDetails) => void;
  handleDeleteLink: (linkId: string) => Promise<void>;
  setModuleLinkModal: (value: boolean) => void;
};

// Its own observer so the open state initialises from the loaded links and MobX tracks the list.
const ModuleLinksCollapsible = observer(function ModuleLinksCollapsible(props: TModuleLinksCollapsibleProps) {
  const {
    moduleDetails,
    moduleId,
    isEditingAllowed,
    isArchived,
    handleEditLink,
    handleDeleteLink,
    setModuleLinkModal,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(!!moduleDetails?.link_module?.length);
  // plane hooks
  const { t } = useTranslation();

  const linkCount = moduleDetails.link_module?.length ?? 0;
  const canAddLink = isEditingAllowed && !isArchived;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={<span className="text-caption-md-semibold text-primary">{t("common.links")}</span>}
      trailing={
        <div className="flex items-center gap-2">
          {linkCount > 0 && <span className="text-caption-md-regular text-placeholder">{linkCount}</span>}
          {canAddLink && (
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t("add_link")}
              icon={<Icon icon={AddOutline} />}
              onClick={() => setModuleLinkModal(true)}
            />
          )}
        </div>
      }
    >
      <div className="mt-4 flex w-full flex-col gap-2">
        {isEditingAllowed && moduleDetails.link_module && moduleDetails.link_module.length > 0 ? (
          moduleId && (
            <div className="-mx-2 flex flex-col gap-0.5">
              <ModuleLinksList
                moduleId={moduleId}
                handleEditLink={handleEditLink}
                handleDeleteLink={handleDeleteLink}
                disabled={!isEditingAllowed || isArchived}
              />
            </div>
          )
        ) : (
          <p className="text-body-xs-regular text-tertiary">{t("common.no_links_added_yet")}</p>
        )}
      </div>
    </Collapsible>
  );
});

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
  // refs
  const headerRef = useRef<HTMLDivElement>(null);
  // router
  const { workspaceSlug, projectId } = useParams();

  // store hooks
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const { data: userProfile } = useUserProfile();

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

  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      if (!workspaceSlug || !projectId) return;
      try {
        await deleteModuleLink(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), linkId);
        setToast({
          type: "success",
          title: "Success!",
          message: "Module link deleted successfully.",
        });
      } catch (_error) {
        setToast({
          type: "error",
          title: "Error!",
          message: "Some error occurred",
        });
      }
    },
    [workspaceSlug, projectId, moduleId, deleteModuleLink]
  );

  const handleDateChange = async (startDate: Date | undefined, targetDate: Date | undefined) => {
    submitChanges({
      start_date: startDate ? renderFormattedPayloadDate(startDate) : null,
      target_date: targetDate ? renderFormattedPayloadDate(targetDate) : null,
    });
    setToast({
      type: "success",
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

  const handleEditLink = useCallback((link: ILinkDetails) => {
    setSelectedLinkToUpdate(link);
    setModuleLinkModal(true);
  }, []);

  if (!moduleDetails)
    return (
      <Loader className="flex flex-col gap-6 py-4">
        <Loader.Item height="24px" width="60%" />
        <div className="flex flex-col gap-3">
          <Loader.Item height="16px" />
          <Loader.Item height="16px" width="80%" />
        </div>
        <div className="flex flex-col gap-3">
          <Loader.Item height="28px" />
          <Loader.Item height="28px" />
          <Loader.Item height="28px" />
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
    <div className="relative flex flex-col gap-6 py-4">
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
      <div ref={headerRef} className="flex items-start gap-3">
        {/* h-lh keeps the status icon on the title's first line; py-0.5 centres that line on the header actions. */}
        <div className="flex min-w-0 flex-1 items-start gap-1 py-0.5 text-body-md-semibold">
          {moduleStatus && (
            <span className="flex h-lh w-5 shrink-0 items-center justify-center">
              <ModuleStatusIcon status={moduleStatus.value} height="14px" width="14px" />
            </span>
          )}
          <h4 className="min-w-0 flex-1 wrap-break-word text-primary">{moduleDetails.name}</h4>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {workspaceSlug && projectId && (
            <ModuleQuickActions
              parentRef={headerRef}
              moduleId={moduleId}
              projectId={projectId.toString()}
              workspaceSlug={workspaceSlug.toString()}
            />
          )}
          <IconButton
            variant="ghost"
            size="md"
            aria-label={t("close")}
            icon={<Icon icon={CloseOutline} />}
            onClick={() => handleClose()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {moduleDetails.description?.trim() && (
          <>
            <ModuleSidebarDescription description={moduleDetails.description} />
            <div className="w-full border-t border-subtle" />
          </>
        )}

        <Collapsible
          defaultOpen
          trigger={<span className="text-caption-md-semibold text-primary">{t("common.properties")}</span>}
        >
          <div className="mt-4 flex flex-col gap-2">
            <SidebarPropertyListItem icon={StateOutline} label={t("state")}>
              <Controller
                control={control}
                name="status"
                render={({ field: { value } }) => (
                  <ModuleStatusDropdown
                    isDisabled={!isEditingAllowed || !!isArchived}
                    variant="select-ghost-md"
                    moduleDetails={{ ...moduleDetails, status: value ?? moduleDetails.status }}
                    handleModuleDetailsChange={submitChanges}
                  />
                )}
              />
            </SidebarPropertyListItem>
            <SidebarPropertyListItem icon={StartDateOutline} label={t("date_range")}>
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
                        <DateRangeSelect
                          variant="select-ghost-md"
                          value={{
                            from: startDate ?? null,
                            to: endDate ?? null,
                          }}
                          onChange={(range) => {
                            onChangeStartDate(range.from ? renderFormattedPayloadDate(range.from) : null);
                            onChangeEndDate(range.to ? renderFormattedPayloadDate(range.to) : null);
                            void handleDateChange(range.from ?? undefined, range.to ?? undefined);
                          }}
                          mergeDates
                          placeholder={`${t("start_date")} - ${t("end_date")}`}
                          weekStartsOn={userProfile?.start_of_the_week}
                          disabled={!isEditingAllowed || isArchived}
                        />
                      );
                    }}
                  />
                )}
              />
            </SidebarPropertyListItem>
            <SidebarPropertyListItem icon={LeadOutline} label={t("lead")}>
              <Controller
                control={control}
                name="lead_id"
                render={({ field: { value } }) => (
                  <MemberSelect
                    value={value ?? null}
                    onChange={(val) => {
                      void submitChanges({ lead_id: val });
                    }}
                    projectId={projectId?.toString() ?? ""}
                    multiple={false}
                    placeholder={t("lead")}
                    disabled={!isEditingAllowed || isArchived}
                    variant="select-ghost-md"
                  />
                )}
              />
            </SidebarPropertyListItem>
            <SidebarPropertyListItem icon={MembersOutline} label={t("members")}>
              <Controller
                control={control}
                name="member_ids"
                render={({ field: { value } }) => (
                  <MemberSelect
                    value={value ?? []}
                    onChange={(val: string[]) => {
                      void submitChanges({ member_ids: val });
                    }}
                    multiple
                    projectId={projectId?.toString() ?? ""}
                    placeholder={t("members")}
                    disabled={!isEditingAllowed || isArchived}
                    variant="select-ghost-md"
                    showLabel={(value ?? []).length <= 1}
                  />
                )}
              />
            </SidebarPropertyListItem>
            <SidebarPropertyListItem icon={WorkItemsOutline} label={t("issues")}>
              <span className="px-1.5 text-body-xs-regular text-tertiary">{issueCount}</span>
            </SidebarPropertyListItem>
            {/**
             * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
             */}
            {isEstimatePointValid && (
              <SidebarPropertyListItem icon={WorkItemsOutline} label={t("points")}>
                <span className="px-1.5 text-body-xs-regular text-tertiary">{issueEstimatePointCount}</span>
              </SidebarPropertyListItem>
            )}
          </div>
        </Collapsible>

        <div className="w-full border-t border-subtle" />
        {workspaceSlug && projectId && moduleDetails?.id && (
          <ModuleAnalyticsProgress
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            moduleId={moduleDetails?.id}
          />
        )}

        <div className="w-full border-t border-subtle" />
        <ModuleLinksCollapsible
          moduleDetails={moduleDetails}
          moduleId={moduleId}
          isEditingAllowed={isEditingAllowed}
          isArchived={!!isArchived}
          handleEditLink={handleEditLink}
          handleDeleteLink={handleDeleteLink}
          setModuleLinkModal={setModuleLinkModal}
        />
      </div>
    </div>
  );
});
