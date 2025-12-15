import type { FC } from "react";
import { observer } from "mobx-react";

// plane types
import { CloseIcon } from "@plane/propel/icons";
import type { TInboxIssueFilterMemberKeys } from "@plane/types";
// plane ui
import { Avatar, Tag } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type InboxIssueAppliedFiltersMember = {
  filterKey: TInboxIssueFilterMemberKeys;
  label: string;
};

export const InboxIssueAppliedFiltersMember = observer(function InboxIssueAppliedFiltersMember(
  props: InboxIssueAppliedFiltersMember
) {
  const { filterKey, label } = props;
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getUserDetails } = useMember();
  // derived values
  const filteredValues = inboxFilters?.[filterKey] || [];
  const currentOptionDetail = (memberId: string) => getUserDetails(memberId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters(filterKey, undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-11 text-secondary">{label}</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <Avatar
                name={optionDetail.display_name}
                src={getFileURL(optionDetail.avatar_url)}
                showTooltip={false}
                size="sm"
              />
            </div>
            <div className="text-11 truncate">{optionDetail?.display_name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
              onClick={() => handleInboxIssueFilters(filterKey, handleFilterValue(value))}
            >
              <CloseIcon className={`w-3 h-3`} />
            </div>
          </div>
        );
      })}

      <div
        className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
        onClick={clearFilter}
      >
        <CloseIcon className={`w-3 h-3`} />
      </div>
    </Tag>
  );
});
