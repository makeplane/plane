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
import { Tags } from "lucide-react";
// plane imports
import { EIconSize, getRandomLabelColor } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  CalendarLayoutIcon,
  DueDatePropertyIcon,
  EpicIcon,
  InitiativeStateIcon,
  ProjectIcon,
  StartDatePropertyIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";
import type { TInitiativeStates } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web components
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { InitiativeLabelDropdown } from "@/components/initiatives/components/labels/initiative-label-dropdown";
import { InitiativeStateDropdown } from "@/components/initiatives/components/states/initiative-state-dropdown";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleInitiativeStateUpdate: (state: TInitiativeStates) => void;
  handleInitiativeLabelUpdate: (labelIds: string[]) => void;
};

export const InitiativeSidebarPropertiesRoot = observer(function InitiativeSidebarPropertiesRoot(props: Props) {
  const { workspaceSlug, initiativeId, disabled, handleInitiativeStateUpdate, handleInitiativeLabelUpdate } = props;

  const {
    initiative: {
      getInitiativeById,
      updateInitiative,
      scope: {
        epics: { getInitiativeEpicsDetailById },
      },
    },
  } = useInitiatives();
  const { getUserDetails } = useMember();
  const {
    initiative: { getInitiativesLabels, createInitiativeLabel, toggleEpicModal, toggleProjectsModal },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
  const initiativeEpicIds = getInitiativeEpicsDetailById(initiativeId) ?? initiative?.epic_ids ?? [];
  const initiativeProjectIds = initiative?.project_ids || [];
  const initiativeLabelIds = initiative?.label_ids || [];

  const createdByDetails = initiative ? getUserDetails(initiative?.created_by) : undefined;

  // Get initiative labels for initiatives
  const allInitiativeLabels = getInitiativesLabels(workspaceSlug);

  if (!initiative) return <></>;

  const handleDates = (payload: Partial<TInitiative>) =>
    updateInitiative &&
    updateInitiative(workspaceSlug.toString(), initiative.id, {
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
    });

  const handleLead = (id: string | null) =>
    updateInitiative &&
    updateInitiative(workspaceSlug.toString(), initiative.id, {
      lead: id,
    });

  const createLabel = async (labelName: string) => {
    const createdLabel = await createInitiativeLabel(workspaceSlug, { name: labelName, color: getRandomLabelColor() });
    return createdLabel;
  };

  return (
    <SidebarContentWrapper title="Properties">
      <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
        {/* States Drop down */}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <InitiativeStateIcon className="h-4 w-4 shrink-0" state="DRAFT" size={EIconSize.XL} />
            <span className="text-13 font-medium text-tertiary">State</span>
          </div>
          <InitiativeStateDropdown
            value={initiative.state}
            onChange={(val) => handleInitiativeStateUpdate(val)}
            disabled={disabled}
            buttonClassName="h-full"
          />
        </div>
        {/* Projects Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <ProjectIcon className="h-4 w-4 shrink-0" />
            <span className="text-13 font-medium text-tertiary">{t("projects")}</span>
          </div>
          <button
            className="text-11 font-medium text-tertiary border-[0.5px] px-2 py-1 border-subtle-1 hover:bg-layer-1-hover rounded-sm cursor-pointer"
            onClick={() => toggleProjectsModal(true)}
          >
            {initiativeProjectIds?.length} {initiativeProjectIds?.length === 1 ? "project" : "projects"}
          </button>
        </div>
        {/* Epics dropdown */}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <EpicIcon className="h-4 w-4 text-tertiary" />
            <span className="text-13 font-medium text-tertiary">{t("common.epic")}</span>
          </div>
          <button
            className="text-11 font-medium text-tertiary border-[0.5px] px-2 py-1 border-subtle-1 hover:bg-layer-1-hover rounded-sm cursor-pointer"
            onClick={() => toggleEpicModal(true)}
          >
            {initiativeEpicIds?.length} {initiativeEpicIds?.length === 1 ? t("epic") : t("common.epics")}
          </button>
        </div>
        {/* Lead Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <UserCirclePropertyIcon className="h-4 w-4 shrink-0" />
            <span className="text-13 font-medium text-tertiary">{t("lead")}</span>
          </div>
          <MemberDropdown
            value={initiative.lead}
            onChange={(lead) => handleLead(lead === initiative.lead ? null : lead)}
            multiple={false}
            buttonVariant="transparent-with-text"
            placeholder={t("lead")}
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            showUserDetails
          />
        </div>
        {/* Dates Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <CalendarLayoutIcon className="h-4 w-4 shrink-0" />
            <span className="text-13 font-medium text-tertiary">Start date</span>
          </div>
          <DateDropdown
            value={initiative.start_date}
            onChange={(val) => {
              handleDates({
                start_date: val ? renderFormattedPayloadDate(val) : null,
                end_date: initiative.end_date,
              });
            }}
            placeholder={t("common.order_by.start_date")}
            icon={<StartDatePropertyIcon className="h-3 w-3 shrink-0" />}
            buttonVariant={initiative.start_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-6 w-full flex cursor-pointer items-center gap-1.5 text-tertiary rounded-sm text-11`}
            optionsClassName="z-30"
            showTooltip
            maxDate={getDate(initiative.end_date)}
          />
        </div>
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <CalendarLayoutIcon className="h-4 w-4 shrink-0" />
            <span className="text-13 font-medium text-tertiary">Due date</span>
          </div>
          <DateDropdown
            value={initiative.end_date}
            onChange={(val) => {
              handleDates({
                start_date: initiative.start_date,
                end_date: val ? renderFormattedPayloadDate(val) : null,
              });
            }}
            placeholder={t("common.order_by.due_date")}
            icon={<DueDatePropertyIcon className="h-3 w-3 shrink-0" />}
            buttonVariant={initiative.end_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-6 w-full flex cursor-pointer items-center gap-1.5 text-tertiary rounded-sm text-11`}
            optionsClassName="z-30"
            showTooltip
            minDate={getDate(initiative.start_date)}
          />
        </div>
        {createdByDetails && (
          <div className="flex h-8 items-center gap-2">
            <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
              <UserCirclePropertyIcon className="h-4 w-4 shrink-0" />
              <span className="text-13 font-medium text-tertiary">{t("common.created_by")}</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-13 justify-between cursor-not-allowed">
              <ButtonAvatars showTooltip userIds={createdByDetails.id} />
              <span className="grow truncate text-11 leading-5">{createdByDetails?.display_name}</span>
            </div>
          </div>
        )}
        {/* Labels Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 shrink-0 items-center gap-1 text-13 text-tertiary">
            <Tags className="h-4 w-4 text-tertiary" />
            <span className="text-13 font-medium text-tertiary">Labels</span>
          </div>
          <InitiativeLabelDropdown
            value={initiativeLabelIds || []}
            labels={allInitiativeLabels}
            onChange={(val: string[]) => handleInitiativeLabelUpdate(val)}
            placeholder={t("label")}
            onAddLabel={createLabel}
          />
        </div>
      </div>
    </SidebarContentWrapper>
  );
});
