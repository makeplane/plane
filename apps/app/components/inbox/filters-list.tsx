// hooks
import useInboxView from "hooks/use-inbox-view";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getPriorityIcon } from "components/icons";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// constants
import { INBOX_STATUS } from "constants/inbox";

export const InboxFiltersList = () => {
  const { filters, setFilters, clearAllFilters, filtersLength } = useInboxView();

  if (filtersLength <= 0) return <></>;

  return (
    <div className="flex items-center gap-2 flex-wrap text-[0.65rem] p-3">
      {Object.keys(filters).map((key) => {
        const filterKey = key as keyof typeof filters;

        if (filters[filterKey] !== null)
          return (
            <div
              key={key}
              className="flex items-center gap-x-2 rounded-full border border-custom-border-300 bg-custom-background-80 px-2 py-1"
            >
              <span className="capitalize text-custom-text-200">
                {replaceUnderscoreIfSnakeCase(key)}:
              </span>
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
                          <span>{getPriorityIcon(priority)}</span>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() =>
                              setFilters({
                                priority: filters.priority?.filter((p) => p !== priority),
                              })
                            }
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            priority: null,
                          })
                        }
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : filterKey === "inbox_status" ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {filters.inbox_status?.map((status) => (
                        <div
                          key={status}
                          className="inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 capitalize bg-custom-background-90 text-custom-text-200"
                        >
                          <span>{INBOX_STATUS.find((s) => s.value === status)?.label}</span>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() =>
                              setFilters({
                                inbox_status: filters.inbox_status?.filter((p) => p !== status),
                              })
                            }
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            inbox_status: null,
                          })
                        }
                      >
                        <XMarkIcon className="h-3 w-3" />
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
        onClick={clearAllFilters}
        className="flex items-center gap-x-1 rounded-full border border-custom-border-300 bg-custom-background-80 px-3 py-1.5 text-custom-text-200 hover:text-custom-text-100"
      >
        <span>Clear all</span>
        <XMarkIcon className="h-3 w-3" />
      </button>
    </div>
  );
};
