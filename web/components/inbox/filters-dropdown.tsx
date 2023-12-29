import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useInboxFilters } from "hooks/store";
// ui
import { MultiLevelDropdown } from "components/ui";
// icons
import { PriorityIcon } from "@plane/ui";
// types
import { IInboxFilterOptions } from "@plane/types";
// constants
import { INBOX_STATUS } from "constants/inbox";
import { ISSUE_PRIORITIES } from "constants/issue";

export const FiltersDropdown: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { inboxFilters, updateInboxFilters } = useInboxFilters();

  const filters = inboxId ? inboxFilters[inboxId.toString()]?.filters : undefined;

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
            updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), {
              [option.key]: currentValue.filter((val) => val !== option.value),
            });
          else
            updateInboxFilters(workspaceSlug.toString(), projectId.toString(), inboxId.toString(), {
              [option.key]: [...currentValue, option.value],
            });
        }}
        direction="right"
        height="rg"
        options={[
          {
            id: "priority",
            label: "Priority",
            value: ISSUE_PRIORITIES.map((p) => p.key),
            hasChildren: true,
            children: ISSUE_PRIORITIES.map((priority) => ({
              id: priority.key,
              label: (
                <div className="flex items-center gap-2 capitalize">
                  <PriorityIcon priority={priority.key} /> {priority.title ?? "None"}
                </div>
              ),
              value: {
                key: "priority",
                value: priority.key,
              },
              selected: filters?.priority?.includes(priority.key),
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
        <div className="absolute -right-2 -top-2 z-10 grid h-4 w-4 place-items-center rounded-full border border-custom-border-200 bg-custom-background-80 text-[0.65rem] text-custom-text-100">
          <span>{filtersLength}</span>
        </div>
      )}
    </div>
  );
});
