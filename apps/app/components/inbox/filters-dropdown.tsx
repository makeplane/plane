// hooks
import useInboxView from "hooks/use-inbox-view";
// ui
import { MultiLevelDropdown } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons";
// constants
import { PRIORITIES } from "constants/project";
import { INBOX_STATUS } from "constants/inbox";

export const FiltersDropdown: React.FC = () => {
  const { filters, setFilters, filtersLength } = useInboxView();

  return (
    <div className="relative">
      <MultiLevelDropdown
        label="Filters"
        onSelect={(option) => {
          const key = option.key as keyof typeof filters;

          const valueExists = (filters[key] as any[])?.includes(option.value);

          if (valueExists) {
            setFilters({
              [option.key]: ((filters[key] ?? []) as any[])?.filter((val) => val !== option.value),
            });
          } else {
            setFilters({
              [option.key]: [...((filters[key] ?? []) as any[]), option.value],
            });
          }
        }}
        direction="right"
        height="rg"
        options={[
          {
            id: "priority",
            label: "Priority",
            value: PRIORITIES,
            children: [
              ...PRIORITIES.map((priority) => ({
                id: priority === null ? "null" : priority,
                label: (
                  <div className="flex items-center gap-2 capitalize">
                    {getPriorityIcon(priority)} {priority ?? "None"}
                  </div>
                ),
                value: {
                  key: "priority",
                  value: priority === null ? "null" : priority,
                },
                selected: filters?.priority?.includes(priority === null ? "null" : priority),
              })),
            ],
          },
          {
            id: "inbox_status",
            label: "Status",
            value: INBOX_STATUS.map((status) => status.value),
            children: [
              ...INBOX_STATUS.map((status) => ({
                id: status.key,
                label: status.label,
                value: {
                  key: "inbox_status",
                  value: status.value,
                },
                selected: filters?.inbox_status?.includes(status.value),
              })),
            ],
          },
        ]}
      />
      {filtersLength > 0 && (
        <div className="absolute -top-2 -right-2 h-4 w-4 text-[0.65rem] grid place-items-center rounded-full text-custom-text-100 bg-custom-background-80 border border-custom-border-100 z-10">
          <span>{filtersLength}</span>
        </div>
      )}
    </div>
  );
};
