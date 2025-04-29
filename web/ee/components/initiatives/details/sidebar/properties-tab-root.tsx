"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase, Calendar, CalendarCheck2, CalendarClock, UserCircle2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EpicIcon } from "@plane/ui";
// components
import { DateDropdown, MemberDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiative } from "@/plane-web/types/initiative";
type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  toggleEpicModal: (value?: boolean) => void;
  toggleProjectModal: (value?: boolean) => void;
};

export const InitiativeSidebarPropertiesRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled, toggleEpicModal, toggleProjectModal } = props;

  const {
    initiative: { getInitiativeById, updateInitiative, epics: {getInitiativeEpicsById} },
  } = useInitiatives();
  const { getUserDetails } = useMember();

  const { t } = useTranslation();

  // derived values
  const initiativeEpicIds = getInitiativeEpicsById(initiativeId) ?? [];
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
  const initiativeProjectIds = initiative?.project_ids || [];
  const createdByDetails = initiative ? getUserDetails(initiative?.created_by) : undefined;
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

  return (
    <SidebarContentWrapper title="Properties">
      <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
        {/* Projects Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span>{t("projects")}</span>
          </div>
          <button
            className="text-xs font-medium text-custom-text-300 border-[0.5px] px-2 py-1 border-custom-border-300 hover:bg-custom-background-80 rounded cursor-pointer"
            onClick={() => toggleProjectModal(true)}
          >
            {initiativeProjectIds?.length} {initiativeProjectIds?.length === 1 ? "project" : "projects"}
          </button>
        </div>
        {/* Lead Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <UserCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{t("lead")}</span>
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
        {/* Epics dropdown */}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <EpicIcon className="h-4 w-4 text-custom-text-300" />
            <span>{t("common.epic")}</span>
          </div>
          <button
            className="text-xs font-medium text-custom-text-300 border-[0.5px] px-2 py-1 border-custom-border-300 hover:bg-custom-background-80 rounded cursor-pointer"
            onClick={() => toggleEpicModal(true)}
          >
            {initiativeEpicIds?.length} {initiativeEpicIds?.length === 1 ? t("epic") : t("common.epics")}
          </button>
        </div>
        {/* Dates Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Start date</span>
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
            icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={initiative.start_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-6 w-full flex cursor-pointer items-center gap-1.5 text-custom-text-300 rounded text-xs`}
            optionsClassName="z-10"
            showTooltip
            maxDate={getDate(initiative.end_date)}
          />
        </div>
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Due date</span>
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
            icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={initiative.end_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-6 w-full flex cursor-pointer items-center gap-1.5 text-custom-text-300 rounded text-xs`}
            optionsClassName="z-10"
            showTooltip
            minDate={getDate(initiative.start_date)}
          />
        </div>

        {createdByDetails && (
          <div className="flex h-8 items-center gap-2">
            <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
              <UserCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{t("common.created_by")}</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
              <ButtonAvatars showTooltip userIds={createdByDetails.id} />
              <span className="flex-grow truncate text-xs leading-5">{createdByDetails?.display_name}</span>
            </div>
          </div>
        )}
      </div>
    </SidebarContentWrapper>
  );
});
