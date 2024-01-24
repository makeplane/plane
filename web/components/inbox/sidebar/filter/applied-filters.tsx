import { FC } from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useInboxIssues } from "hooks/store";
// icons
import { X } from "lucide-react";
import { PriorityIcon } from "@plane/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TInboxIssueFilterOptions, TIssuePriorities } from "@plane/types";
// constants
import { INBOX_STATUS } from "constants/inbox";

type TInboxIssueAppliedFilter = { workspaceSlug: string; projectId: string; inboxId: string };

export const IssueStatusLabel = ({ status }: { status: number }) => {
  const issueStatusDetail = INBOX_STATUS.find((s) => s.status === status);

  if (!issueStatusDetail) return <></>;

  return (
    <div className="relative flex items-center gap-1">
      <div className={issueStatusDetail.textColor(false)}>
        <issueStatusDetail.icon size={12} />
      </div>
      <div>{issueStatusDetail.title}</div>
    </div>
  );
};

export const InboxIssueAppliedFilter: FC<TInboxIssueAppliedFilter> = observer((props) => {
  const { workspaceSlug, projectId, inboxId } = props;
  // hooks
  const {
    filters: { inboxFilters, updateInboxFilters },
  } = useInboxIssues();

  const filters = inboxFilters?.filters;

  const handleUpdateFilter = (filter: Partial<TInboxIssueFilterOptions>) => {
    if (!workspaceSlug || !projectId || !inboxId) return;
    updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), filter);
  };

  const handleClearAllFilters = () => {
    const newFilters: TInboxIssueFilterOptions = { priority: [], inbox_status: [] };
    updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), newFilters);
  };

  let filtersLength = 0;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof TInboxIssueFilterOptions;
    if (filters?.[filterKey] && Array.isArray(filters[filterKey])) filtersLength += (filters[filterKey] ?? []).length;
  });

  if (!filters || filtersLength <= 0) return <></>;
  return (
    <div className="relative flex flex-wrap items-center gap-2 p-3 text-[0.65rem] border-b border-custom-border-100">
      {Object.keys(filters).map((key) => {
        const filterKey = key as keyof TInboxIssueFilterOptions;

        if (filters[filterKey].length > 0)
          return (
            <div
              key={key}
              className="flex items-center gap-x-2 rounded-full border border-custom-border-200 bg-custom-background-80 px-2 py-1"
            >
              <span className="capitalize text-custom-text-200">{replaceUnderscoreIfSnakeCase(key)}:</span>
              {filters[filterKey]?.length < 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 font-medium">None</span>
              ) : (
                <div className="space-x-2">
                  {filterKey === "priority" ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {filters.priority?.map((priority) => (
                        <div
                          key={priority}
                          className={`inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 capitalize ${
                            priority === "urgent"
                              ? "bg-red-500/20 text-red-500"
                              : priority === "high"
                              ? "bg-orange-500/20 text-orange-500"
                              : priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : priority === "low"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-custom-background-90 text-custom-text-200"
                          }`}
                        >
                          <div className="relative flex items-center gap-1">
                            <div>
                              <PriorityIcon priority={priority as TIssuePriorities} size={14} />
                            </div>
                            <div>{priority}</div>
                          </div>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() =>
                              handleUpdateFilter({
                                priority: filters.priority?.filter((p) => p !== priority),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFilter({
                            priority: [],
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : filterKey === "inbox_status" ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {filters.inbox_status?.map((status) => (
                        <div
                          key={status}
                          className="inline-flex items-center gap-x-1 rounded-full bg-custom-background-90 px-2 py-0.5 capitalize text-custom-text-200"
                        >
                          <IssueStatusLabel status={status} />
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() =>
                              handleUpdateFilter({
                                inbox_status: filters.inbox_status?.filter((p) => p !== status),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateFilter({
                            inbox_status: [],
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    (filters[filterKey] as any)?.join(", ")
                  )}
                </div>
              )}
            </div>
          );
      })}
      <button
        type="button"
        onClick={handleClearAllFilters}
        className="flex items-center gap-x-1 rounded-full border border-custom-border-200 bg-custom-background-80 px-3 py-1.5 text-custom-text-200 hover:text-custom-text-100"
      >
        <span>Clear all</span>
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});
