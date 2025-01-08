"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase, Calendar, UserCircle2 } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DateRangeDropdown, MemberDropdown, ProjectDropdown } from "@/components/dropdowns";
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
};

export const InitiativeSidebarPropertiesRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled } = props;

  const {
    initiative: { getInitiativeById, updateInitiative },
  } = useInitiatives();
  const { getUserDetails } = useMember();

  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
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

  const handleProjects = (ids: string | string[]) => {
    const projectIds = ids ? (Array.isArray(ids) ? ids : [ids]) : [];

    if (projectIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one project.",
      });
      return;
    }

    updateInitiative(workspaceSlug.toString(), initiative.id, {
      project_ids: projectIds,
    })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Initiative projects updated successfully.",
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Failed to update initiative projects. Please try again!",
        });
      });
  };

  return (
    <SidebarContentWrapper title="Properties">
      <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
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
            onChange={(lead) => handleLead(lead === initiative.lead ? null : lead)}
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
    </SidebarContentWrapper>
  );
});
