"use client";

import React from "react";
import { observer } from "mobx-react";
import { Briefcase, Calendar, UserCircle2 } from "lucide-react";
// components
import { DateRangeDropdown, MemberDropdown, ProjectDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiative } from "@/plane-web/types/initiative";

type TInitiativePropertiesProps = {
  workspaceSlug: string;
  initiative: TInitiative;
  isEditable: boolean;
};

export const InitiativeDetailsProperties: React.FC<TInitiativePropertiesProps> = observer((props) => {
  const { workspaceSlug, initiative, isEditable } = props;

  const {
    initiative: { updateInitiative },
  } = useInitiatives();

  const { getUserDetails } = useMember();
  const createdByDetails = getUserDetails(initiative?.created_by);
  if (!initiative) return <></>;

  const handleDates = (startDate: string | null | undefined, endDate: string | null | undefined) => {
    updateInitiative &&
      updateInitiative(workspaceSlug.toString(), initiative.id, {
        start_date: startDate ?? null,
        end_date: endDate ?? null,
      });
  };

  const handleLead = (id: string | null) => {
    updateInitiative &&
      updateInitiative(workspaceSlug.toString(), initiative.id, {
        lead: id,
      });
  };

  const handleProjects = (ids: string | string[]) => {
    updateInitiative &&
      updateInitiative(workspaceSlug.toString(), initiative.id, {
        project_ids: ids ? (Array.isArray(ids) ? ids : [ids]) : null,
      });
  };

  return (
    <>
      <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
        <div className="flex flex-col gap-3 h-full w-full overflow-y-auto">
          <h5 className="text-sm font-medium">Properties</h5>
          <div className={`mb-2 space-y-2.5 ${!isEditable ? "opacity-60" : ""}`}>
            {/* Projects Drop down*/}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span>Projects</span>
              </div>
              <ProjectDropdown
                buttonVariant={"border-with-text"}
                onChange={handleProjects}
                value={initiative.project_ids || []}
                multiple
                showTooltip
              />
            </div>
            {/* Lead Drop down*/}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <UserCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Lead</span>
              </div>
              <MemberDropdown
                value={initiative.lead}
                onChange={handleLead}
                multiple={false}
                buttonVariant="transparent-with-text"
                placeholder="Lead"
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                showUserDetails
              />
            </div>
            {/* Dates Drop down*/}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Dates</span>
              </div>
              <DateRangeDropdown
                buttonVariant="border-with-text"
                className="h-5"
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
                  from: "Start date",
                  to: "End date",
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
                  <span>Created by</span>
                </div>
                <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="flex-grow truncate text-xs leading-5">{createdByDetails?.display_name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
