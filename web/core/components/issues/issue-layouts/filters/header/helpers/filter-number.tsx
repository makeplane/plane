import React, { useState } from "react";
import { FilterHeader } from "@/components/issues";

type FilterNumberProps = {
  groupKey: string;
  /** called with the final filter string, e.g. "invoice__gt:5" or "invoice:5" or "invoice__isnull" */
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
  const [op, setOp] = useState<"gt" | "lt" | "eq" | "ne" | "isbetween" | "isnull" | "isnotnull">("gt");
  const [val1, setVal1] = useState<number | "">("");
  const [val2, setVal2] = useState<number | "">("");

  const apply = () => {
    let payload: string;
    switch (op) {
      case "gt":
      case "lt":
        if (val1 === "") return;
        payload = `${groupKey}__${op}:${val1}`;
        break;

      case "eq":
        if (val1 === "") return;
        payload = `${groupKey}:${val1}`;
        break;

      case "ne":
        if (val1 === "") return;
        payload = `${groupKey}__ne:${val1}`;
        break;

      case "isbetween":
        if (val1 === "" || val2 === "") return;
        payload = `${groupKey}__isbetween:${val1}-${val2}`;
        break;

      case "isnull":
        payload = `${groupKey}__isnull`;
        break;

      case "isnotnull":
        payload = `${groupKey}__isnotnull`;
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
              value={op}
              onChange={(e) => setOp(e.target.value as any)}
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
        <div className="mt-4 w-full">
          <div className="flex items-center space-x-2">
            {/* single-value operators */}
            {["gt", "lt", "eq", "ne"].includes(op) && (
              <input
                type="number"
                value={val1}
                onChange={(e) =>
                  setVal1(e.target.value === "" ? "" : +e.target.value)
                }
                className="border rounded p-1 text-xs flex-grow"
                placeholder="Enter value"
              />
            )}

            {/* between needs two values */}
            {op === "isbetween" && (
              <>
                <input
                  type="number"
                  value={val1}
                  onChange={(e) =>
                    setVal1(e.target.value === "" ? "" : +e.target.value)
                  }
                  className="border rounded p-1 text-xs w-28"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={val2}
                  onChange={(e) =>
                    setVal2(e.target.value === "" ? "" : +e.target.value)
                  }
                  className="border rounded p-1 text-xs w-28"
                  placeholder="Max"
                />
              </>
            )}

            {(["gt", "lt", "eq", "ne", "isbetween"].includes(op)) && (
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
      )}
    </div>
  );
};