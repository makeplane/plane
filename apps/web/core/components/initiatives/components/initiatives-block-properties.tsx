/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { getRandomLabelColor } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// core components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// plane Web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";
// ee components
import { EpicsDropdown } from "../../dropdowns/epics";
// local components
import { InitiativeDateRangeDropdown } from "./initiative-date-range-dropdown";
import { InitiativeLabelDropdown } from "./labels/initiative-label-dropdown";
import { PropertyBlockWrapper } from "./property-block-wrapper";
import { InitiativeStateDropdown } from "./states/initiative-state-dropdown";

type Props = {
  initiative: TInitiative;
  isSidebarCollapsed: boolean | undefined;
  workspaceSlug: string;
};

export const InitiativesBlockProperties = observer(function InitiativesBlockProperties(props: Props) {
  const { initiative, isSidebarCollapsed, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    initiative: { updateInitiative, getInitiativesLabels, createInitiativeLabel, fetchInitiativeAnalytics },
  } = useInitiatives();

  // derived values
  const initiativeLabels = getInitiativesLabels(workspaceSlug);

  const handleLabelChange = (labelIds: string[]) => {
    updateInitiative?.(workspaceSlug, initiative.id, { label_ids: labelIds });
  };

  const handleLeadChange = (leadId: string | null) => {
    if (updateInitiative) {
      updateInitiative(workspaceSlug, initiative.id, { lead: leadId });
    }
  };

  const createLabel = async (labelName: string) => {
    const createdLabel = await createInitiativeLabel(workspaceSlug, { name: labelName, color: getRandomLabelColor() });
    return createdLabel;
  };

  const handleProjectChange = async (projectIds: string[]) => {
    try {
      await updateInitiative(workspaceSlug, initiative.id, { project_ids: projectIds });
      fetchInitiativeAnalytics(workspaceSlug, initiative.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("initiatives.toast.project_update_success"),
      });
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("initiatives.toast.project_update_error"),
      });
    }
  };

  const handleEpicChange = async (epicIds: string[]) => {
    try {
      await updateInitiative(workspaceSlug, initiative.id, { epic_ids: epicIds });
      fetchInitiativeAnalytics(workspaceSlug, initiative.id);
      setToast({
        title: t("toast.success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("initiatives.toast.epic_update_success", { count: epicIds.length }),
      });
    } catch (error) {
      console.error(error);
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.epic_update_error"),
      });
    }
  };

  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
      // Prevent click events from bubbling to parent initiative block.
      // This is necessary to avoid triggering parent click handlers (e.g., for closing or selecting the block)
      onClick={(e) => e.stopPropagation()}
    >
      {/* dates */}
      <PropertyBlockWrapper>
        <InitiativeDateRangeDropdown initiative={initiative} workspaceSlug={workspaceSlug} />
      </PropertyBlockWrapper>

      {/* projects */}
      <PropertyBlockWrapper>
        <ProjectDropdown
          buttonContainerClassName="truncate max-w-40"
          value={initiative.project_ids ?? []}
          onChange={handleProjectChange}
          multiple
          buttonVariant="border-with-text"
          showTooltip
        />
      </PropertyBlockWrapper>
      {/* epics */}
      <PropertyBlockWrapper>
        <EpicsDropdown
          buttonContainerClassName="truncate max-w-40"
          value={initiative.epic_ids ?? []}
          onChange={handleEpicChange}
          searchParams={{}}
          multiple
          buttonVariant="border-with-text"
          showTooltip
        />
      </PropertyBlockWrapper>
      {/*  lead */}
      <PropertyBlockWrapper>
        <MemberDropdown
          value={initiative.lead ?? null}
          onChange={handleLeadChange}
          multiple={false}
          buttonVariant="border-with-text"
          placeholder="Lead"
          showUserDetails
          optionsClassName="z-10"
        />
      </PropertyBlockWrapper>
      {/* state */}
      {initiative.state && (
        <PropertyBlockWrapper>
          <InitiativeStateDropdown
            value={initiative.state}
            placeholder="State"
            size="xs"
            onChange={(state) => updateInitiative?.(workspaceSlug, initiative.id, { state })}
          />
        </PropertyBlockWrapper>
      )}
      {/* labels */}
      <PropertyBlockWrapper>
        <InitiativeLabelDropdown
          value={initiative.label_ids || []}
          labels={initiativeLabels}
          onChange={handleLabelChange}
          onAddLabel={createLabel}
          placeholder=""
          size="xs"
        />
      </PropertyBlockWrapper>
    </div>
  );
});
