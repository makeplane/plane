import { useRouter } from "next/router";
import { CalendarCheck2, CalendarClock } from "lucide-react";
// types
import { TBulkIssueProperties } from "@plane/types";
// components
import { DateDropdown, MemberDropdown, PriorityDropdown, StateDropdown } from "@/components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useBulkIssueOperations } from "@/hooks/store";

export const IssueBulkOperationsProperties: React.FC = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { bulkUpdateProperties, issueIds } = useBulkIssueOperations();

  const handleBulkOperation = (data: Partial<TBulkIssueProperties>) => {
    if (!workspaceSlug || !projectId) return;

    bulkUpdateProperties(workspaceSlug.toString(), projectId.toString(), {
      issue_ids: issueIds,
      properties: data,
    });
  };

  return (
    <>
      <StateDropdown
        value=""
        onChange={(val) => handleBulkOperation({ state_id: val })}
        projectId={projectId?.toString() ?? ""}
        buttonVariant="border-with-text"
      />
      <PriorityDropdown
        value="urgent"
        onChange={(val) => handleBulkOperation({ priority: val })}
        buttonVariant="border-with-text"
      />
      <MemberDropdown
        value={[]}
        onChange={(val) => handleBulkOperation({ assignee_ids: val })}
        buttonVariant="border-with-text"
        placeholder="Assignees"
        multiple
      />
      <DateDropdown
        value={null}
        onChange={(val) => handleBulkOperation({ start_date: val ? renderFormattedPayloadDate(val) : null })}
        buttonVariant="border-with-text"
        placeholder="Start date"
        icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
      />
      <DateDropdown
        value={null}
        onChange={(val) => handleBulkOperation({ target_date: val ? renderFormattedPayloadDate(val) : null })}
        buttonVariant="border-with-text"
        placeholder="Due date"
        icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
      />
    </>
  );
};
