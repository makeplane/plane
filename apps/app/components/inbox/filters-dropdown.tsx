// ui
import { MultiLevelDropdown } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons";
// types
import { IInboxFilterOptions } from "types";
// constants
import { PRIORITIES } from "constants/project";
import { STATUS } from "constants/inbox";

type Props = {
  filters: Partial<IInboxFilterOptions>;
  onSelect: (option: any) => void;
  direction?: "left" | "right";
  height?: "sm" | "md" | "rg" | "lg";
};

export const FiltersDropdown: React.FC<Props> = ({ filters, onSelect, direction, height }) => (
  <MultiLevelDropdown
    label="Filters"
    onSelect={onSelect}
    direction={direction}
    height={height}
    options={[
      {
        id: "priority",
        label: "Priority",
        value: PRIORITIES,
        children: [
          ...PRIORITIES.map((priority) => ({
            id: priority ?? "none",
            label: (
              <div className="flex items-center gap-2">
                {getPriorityIcon(priority)} {priority ?? "None"}
              </div>
            ),
            value: {
              key: "priority",
              value: priority,
            },
            selected: filters?.priority?.includes(priority ?? "none"),
          })),
        ],
      },
      {
        id: "inbox_status",
        label: "Status",
        value: Object.values(STATUS),
        children: [
          ...Object.keys(STATUS).map((status) => ({
            id: status,
            label: status,
            value: {
              key: "inbox_status",
              value: STATUS[status],
            },
            selected: filters?.inbox_status?.includes(STATUS[status]),
          })),
        ],
      },
    ]}
  />
);
