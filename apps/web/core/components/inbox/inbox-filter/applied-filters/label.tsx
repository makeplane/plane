import type { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { CloseIcon } from "@plane/propel/icons";
import { Tag } from "@plane/ui";
import { useLabel } from "@/hooks/store/use-label";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

function LabelIcons({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}

export const InboxIssueAppliedFiltersLabel = observer(function InboxIssueAppliedFiltersLabel() {
  // hooks
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { getLabelById } = useLabel();
  // derived values
  const filteredValues = inboxFilters?.labels || [];
  const currentOptionDetail = (labelId: string) => getLabelById(labelId) || undefined;

  const handleFilterValue = (value: string): string[] =>
    filteredValues?.includes(value) ? filteredValues.filter((v) => v !== value) : [...filteredValues, value];

  const clearFilter = () => handleInboxIssueFilters("labels", undefined);

  if (filteredValues.length === 0) return <></>;
  return (
    <Tag>
      <div className="text-11 text-secondary">Label</div>
      {filteredValues.map((value) => {
        const optionDetail = currentOptionDetail(value);
        if (!optionDetail) return <></>;
        return (
          <div key={value} className="relative flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <div className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden">
              <LabelIcons color={optionDetail.color} />
            </div>
            <div className="text-11 truncate">{optionDetail?.name}</div>
            <div
              className="w-3 h-3 flex-shrink-0 relative flex justify-center items-center overflow-hidden cursor-pointer text-tertiary hover:text-secondary transition-all"
              onClick={() => handleInboxIssueFilters("labels", handleFilterValue(value))}
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
