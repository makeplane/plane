import React, { useState } from "react";
import { FilterHeader } from "@/components/issues";
import { Input  } from "@plane/ui";

type FilterNumberProps = {
  groupKey: string;
  onFilter: (filter: string) => void;
  title: string;
  isPreviewEnabled: boolean;
  handleIsPreviewEnabled: () => void;
};

export const FilterNumber: React.FC<FilterNumberProps> = ({
  groupKey,
  onFilter,
  title,
  isPreviewEnabled,
  handleIsPreviewEnabled,
}) => {
  const [operator, setOperator] = useState<"gt" | "lt" | "eq" | "ne" | "isbetween" | "isnull" | "isnotnull">("gt");
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  const apply = () => {
    let payload: string;
    switch (operator) {
      case "gt":
      case "lt":
        if (from === null) return;
        payload = `${groupKey}__${operator}:${from}`;
        break;

      case "eq":
        if (from === null) return;
        payload = `${groupKey}:${from}`;
        break;

      case "ne":
        if (from === null) return;
        payload = `${groupKey}__ne:${from}`;
        break;

      case "isbetween":
        if (from === null || to === null) return;
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
              <option value="gt">Is greater than</option>
              <option value="lt">Is less than</option>
              <option value="eq">Is equal to</option>
              <option value="ne">Is not equal to</option>
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
            {/* single-value operators */}
            {["gt", "lt", "eq", "ne"].includes(operator) && (
              <Input
                type="number"
                value={from === null ? "" : from}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFrom(e.target.value ? +e.target.value : null)
                }
                className="border rounded p-1 text-xs flex-grow"
                placeholder="Enter value"
              />
            )}

            {/* between needs two values */}
            {operator === "isbetween" && (
              <>
                <Input
                  type="number"
                  value={from === null ? "" : from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFrom(e.target.value ? +e.target.value : null)
                  }
                  className="border rounded p-1 text-xs w-28"
                  placeholder="Min"
                />
                <Input
                  type="number"
                  value={to === null ? "" : to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTo(e.target.value ? +e.target.value : null)
                  }
                  className="border rounded p-1 text-xs w-28"
                  placeholder="Max"
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
