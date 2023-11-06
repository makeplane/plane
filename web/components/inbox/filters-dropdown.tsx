import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { MultiLevelDropdown } from "components/ui";
// icons
import { PriorityIcon } from "@plane/ui";
// types
import { IInboxFilterOptions } from "types";
// constants
import { PRIORITIES } from "constants/project";
import { INBOX_STATUS } from "constants/inbox";

export const FiltersDropdown: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxFilters: inboxFiltersStore } = useMobxStore();

  const filters = inboxId ? inboxFiltersStore.inboxFilters[inboxId.toString()]?.filters : undefined;

  let filtersLength = 0;
  Object.keys(filters ?? {}).forEach((key) => {
    const filterKey = key as keyof IInboxFilterOptions;

    if (filters?.[filterKey] && Array.isArray(filters[filterKey])) filtersLength += (filters[filterKey] ?? []).length;
  });

  return (
    <div className="relative">
      <MultiLevelDropdown
        label="Filters"
        onSelect={(option) => {
          if (!workspaceSlug || !projectId || !inboxId) return;

          const key = option.key as keyof IInboxFilterOptions;
          const currentValue: any[] = filters?.[key] ?? [];

          const valueExists = currentValue.includes(option.value);

          if (valueExists)
            inboxFiltersStore.updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), {
              [option.key]: currentValue.filter((val) => val !== option.value),
            });
          else
            inboxFiltersStore.updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), {
              [option.key]: [...currentValue, option.value],
            });
        }}
        direction="right"
        height="rg"
        options={[
          {
            id: "priority",
            label: "Priority",
            value: PRIORITIES,
            hasChildren: true,
            children: PRIORITIES.map((priority) => ({
              id: priority === null ? "null" : priority,
              label: (
                <div className="flex items-center gap-2 capitalize">
                  <PriorityIcon priority={priority} /> {priority ?? "None"}
                </div>
              ),
              value: {
                key: "priority",
                value: priority === null ? "null" : priority,
              },
              selected: filters?.priority?.includes(priority === null ? "null" : priority),
            })),
          },
          {
            id: "inbox_status",
            label: "Status",
            value: INBOX_STATUS.map((status) => status.value),
            hasChildren: true,
            children: INBOX_STATUS.map((status) => ({
              id: status.key,
              label: status.label,
              value: {
                key: "inbox_status",
                value: status.value,
              },
              selected: filters?.inbox_status?.includes(status.value),
            })),
          },
        ]}
      />
      {filtersLength > 0 && (
        <div className="absolute -top-2 -right-2 h-4 w-4 text-[0.65rem] grid place-items-center rounded-full text-custom-text-100 bg-custom-background-80 border border-custom-border-200 z-10">
          <span>{filtersLength}</span>
        </div>
      )}
    </div>
  );
});
