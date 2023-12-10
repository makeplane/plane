import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// icons
import { X } from "lucide-react";
import { PriorityIcon } from "@plane/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { IInboxFilterOptions, TIssuePriorities } from "types";
// constants
import { INBOX_STATUS } from "constants/inbox";

export const InboxFiltersList = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxFilters: inboxFiltersStore } = useMobxStore();

  const filters = inboxId ? inboxFiltersStore.inboxFilters[inboxId.toString()]?.filters : undefined;

  const handleUpdateFilter = (filter: Partial<IInboxFilterOptions>) => {
    if (!workspaceSlug || !projectId || !inboxId) return;

    inboxFiltersStore.updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), filter);
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !inboxId) return;

    const newFilters: IInboxFilterOptions = {};
    Object.keys(filters ?? {}).forEach((key) => {
      newFilters[key as keyof IInboxFilterOptions] = null;
    });

    inboxFiltersStore.updateInboxFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      inboxId.toString(),
      newFilters
    );
  };

  let filtersLength = 0;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof IInboxFilterOptions;

    if (filters?.[filterKey] && Array.isArray(filters[filterKey])) filtersLength += (filters[filterKey] ?? []).length;
  });

  if (!filters || filtersLength <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 text-[0.65rem]">
      {Object.keys(filters).map((key) => {
        const filterKey = key as keyof IInboxFilterOptions;

        if (filters[filterKey])
          return (
            <div
              key={key}
              className="flex items-center gap-x-2 rounded-full border border-custom-border-200 bg-custom-background-80 px-2 py-1"
            >
              <span className="capitalize text-custom-text-200">{replaceUnderscoreIfSnakeCase(key)}:</span>
              {filters[filterKey] === null || (filters[filterKey]?.length ?? 0) <= 0 ? (
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
                          <span>
                            <PriorityIcon priority={priority as TIssuePriorities} />
                          </span>
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
                            priority: null,
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
                          <span>{INBOX_STATUS.find((s) => s.value === status)?.label}</span>
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
                            inbox_status: null,
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
