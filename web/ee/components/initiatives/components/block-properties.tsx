import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
// plane
import { Avatar, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { DateRangeDropdown, MemberDropdown, ProjectDropdown } from "@/components/dropdowns";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// Plane Web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiative } from "@/plane-web/types/initiative";
import { EpicsDropdown } from "../../dropdowns";

type Props = {
  initiative: TInitiative;
  isSidebarCollapsed: boolean | undefined;
  disabled?: boolean;
};

export const BlockProperties = observer((props: Props) => {
  const { initiative, isSidebarCollapsed, disabled = false } = props;
  const {
    initiative: { updateInitiative },
  } = useInitiatives();
  const { workspaceSlug } = useParams();
  const { getUserDetails } = useMember();

  const lead = getUserDetails(initiative.lead ?? "");

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

  const handleChange = (updatedData: Partial<TInitiative>) => {
    if (updateInitiative) {
      updateInitiative(workspaceSlug.toString(), initiative.id, updatedData);
    }
  };
  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
    >
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
          to: !!initiative.end_date,
        }}
        renderPlaceholder={false}
        disabled={disabled}
      />

      <div className="h-5">
        <MemberDropdown
          value={initiative.lead}
          onChange={handleLead}
          multiple={false}
          buttonVariant="border-with-text"
          placeholder="Lead"
          showUserDetails
          button={
            <Tooltip tooltipContent="Lead" position={"top"} className="ml-4">
              <div
                className={cn(
                  "h-full text-xs px-2 flex items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded",
                  { "cursor-not-allowed": disabled }
                )}
              >
                {lead ? (
                  <>
                    <Avatar
                      key={lead.id}
                      name={lead.display_name}
                      src={getFileURL(lead.avatar_url)}
                      size={14}
                      className="text-[9px]"
                    />
                    <div>{lead.first_name}</div>
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 flex-shrink-0" />
                    <div>Lead</div>
                  </>
                )}
              </div>
            </Tooltip>
          }
          disabled={disabled}
        />
      </div>

      <div className="h-5">
        <ProjectDropdown
          buttonVariant={"border-with-text"}
          onChange={(ids) => handleChange({ project_ids: ids ? (Array.isArray(ids) ? ids : [ids]) : null })}
          value={initiative.project_ids || []}
          multiple
          showTooltip
          disabled={disabled}
        />
      </div>

      <div className="h-5">
        <EpicsDropdown
          buttonVariant={"border-with-text"}
          onChange={(ids) => handleChange({ epic_ids: ids ? (Array.isArray(ids) ? ids : [ids]) : null })}
          value={initiative.epic_ids || []}
          multiple
          showTooltip
          disabled={disabled}
          searchParams={{
            initiative_id: initiative.id,
          }}
        />
      </div>
    </div>
  );
});
