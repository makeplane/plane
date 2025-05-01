import React, { useState } from "react";
import { FilterHeader } from "@/components/issues";
import { Input  } from "@plane/ui";

type FilterDateProps = {
  groupKey: string;
  onFilter: (filter: string) => void;
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
};

export const FilterDate: React.FC<FilterDateProps> = ({
  groupKey,
  onFilter,
  title,
  isPreviewEnabled,
  handleIsPreviewEnabled,
}) => {
  const [operator, setOperator] = useState<"gt" | "lt" | "eq" | "ne" | "isbetween" | "isnull" | "isnotnull">("gt");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const apply = () => {
    let payload: string;
    switch (operator) {
      case "gt":
      case "lt":
        if (!from) return;
        payload = `${groupKey}__${operator}:${from}`;
        break;

      case "eq":
        if (!from) return;
        payload = `${groupKey}:${from}`;
        break;

      case "ne":
        if (!from) return;
        payload = `${groupKey}__ne:${from}`;
        break;

      case "isbetween":
        if (!from || !to) return;
        payload = `${groupKey}__isbetween:${from}^${to}`;
        break;

      case "isnull":
        payload = `${groupKey}__isnull:`;
        break;

      case "isnotnull":
        payload = `${groupKey}__isnotnull:`;
        break;

      default:
        return;
    }
    onFilter(payload);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <FilterHeader
          title={title}
          isPreviewEnabled={isPreviewEnabled}
          handleIsPreviewEnabled={handleIsPreviewEnabled}
        />

        {isPreviewEnabled && (
          <div className="flex items-center">
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className="text-xs text-custom-primary-100"
            >
              <option value="gt">Is after</option>
              <option value="lt">Is before</option>
              <option value="eq">Is on</option>
              <option value="ne">Is not on</option>
              <option value="isbetween">Is between</option>
              <option value="isnull">Is null</option>
              <option value="isnotnull">Is not null</option>
            </select>
          </div>
        )}
      </div>

      {isPreviewEnabled && (
        <div className="mt-2 w-full">
          <div className="flex items-center space-x-2">
            {["gt", "lt", "eq", "ne"].includes(operator) && (
              <Input
                type="date"
                value={from}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                className="border rounded p-1 text-xs flex-grow"
              />
            )}

            {operator === "isbetween" && (
              <>
                <Input
                  type="date"
                  value={from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                  className="border rounded p-1 text-xs flex-grow"
                />
                <Input
                  type="date"
                  value={to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                  className="border rounded p-1 text-xs flex-grow"
                />
              </>
            )}
            <div className="flex justify-end flex-grow">
              {["gt", "lt", "eq", "ne", "isbetween", "isnull", "isnotnull"].includes(operator) && (
                <button
                  type="button"
                  className="text-xs font-medium text-custom-primary-100 hover:text-custom-primary-200 cursor-pointer p-1"
                  onClick={apply}
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
