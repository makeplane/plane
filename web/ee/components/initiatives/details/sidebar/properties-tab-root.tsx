"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase, Calendar, UserCircle2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EpicIcon } from "@plane/ui";
// components
import { DateRangeDropdown, MemberDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
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
    initiative: { getInitiativeById, updateInitiative, getInitiativeEpicsById },
  } = useInitiatives();
  const { getUserDetails } = useMember();

  const { t } = useTranslation();

  // derived values
  const initiativeEpicIds = getInitiativeEpicsById(initiativeId) ?? [];
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
  const initiativeProjectIds = initiative?.project_ids || [];
  const createdByDetails = initiative ? getUserDetails(initiative?.created_by) : undefined;
  if (!initiative) return <></>;

  const handleDates = (startDate: string | null | undefined, endDate: string | null | undefined) =>
    updateInitiative &&
    updateInitiative(workspaceSlug.toString(), initiative.id, {
      start_date: startDate ?? null,
      end_date: endDate ?? null,
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
            {initiativeEpicIds?.length} {initiativeEpicIds?.length === 1 ? t("epic") : t("epics")}
          </button>
        </div>
        {/* Dates Drop down*/}
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{t("common.dates")}</span>
          </div>
          <DateRangeDropdown
            buttonVariant="border-with-text"
            buttonClassName="px-2 py-1 h-fit"
            value={{
              from: getDate(initiative.start_date),
              to: getDate(initiative.end_date),
            }}
            onSelect={(val) => {
              handleDates(
                val?.from ? renderFormattedPayloadDate(val.from) : null,
                val?.to ? renderFormattedPayloadDate(val.to) : null
              );
            }}
            placeholder={{
              from: t("start_date"),
              to: t("end_date"),
            }}
            hideIcon={{
              to: true,
            }}
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
