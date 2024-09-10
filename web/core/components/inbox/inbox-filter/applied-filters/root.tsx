import { FC } from "react";
import { observer } from "mobx-react";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import {
  InboxIssueAppliedFiltersStatus,
  InboxIssueAppliedFiltersPriority,
  InboxIssueAppliedFiltersMember,
  InboxIssueAppliedFiltersLabel,
  InboxIssueAppliedFiltersDate,
  InboxIssueAppliedFiltersState,
} from "@/components/inbox";
// hooks
import { useProjectInbox } from "@/hooks/store";

export const InboxIssueAppliedFilters: FC = observer(() => {
  const { getAppliedFiltersCount } = useProjectInbox();

  if (getAppliedFiltersCount === 0) return <></>;
  return (
    <Header variant={EHeaderVariant.TERNARY}>
      {/* status */}
      <InboxIssueAppliedFiltersStatus />
      {/* state */}
      <InboxIssueAppliedFiltersState />
      {/* priority */}
      <InboxIssueAppliedFiltersPriority />
      {/* assignees */}
      <InboxIssueAppliedFiltersMember filterKey="assignees" label="Assignees" />
      {/* created_by */}
      <InboxIssueAppliedFiltersMember filterKey="created_by" label="Created By" />
      {/* label */}
      <InboxIssueAppliedFiltersLabel />
      {/* created_at */}
      <InboxIssueAppliedFiltersDate filterKey="created_at" label="Created date" />
      {/* updated_at */}
      <InboxIssueAppliedFiltersDate filterKey="updated_at" label="Updated date" />
    </Header>
  );
});
