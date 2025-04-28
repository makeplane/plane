import React, { useState } from "react";

type FilterDateProps = {
  groupKey: string;
  /** called with the final filter string, e.g. "days__lt:2025-04-01" or "days:2025-04-11" or "days__isnull" */
  onFilter: (filter: string) => void;
};

export const FilterDate: React.FC<FilterDateProps> = ({
  groupKey,
  onFilter,
}) => {
  const [op, setOp] = useState<
    "gt" | "lt" | "eq" | "ne" | "isbetween" | "isnull" | "isnotnull"
  >("gt");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const apply = () => {
    let payload: string;
    switch (op) {
      case "gt": // after
      case "lt": // before
        if (!from) return;
        payload = `${groupKey}__${op}:${from}`;
        break;

      case "eq": // on
        if (!from) return;
        payload = `${groupKey}:${from}`;
        break;

      case "ne": // not on
        if (!from) return;
        payload = `${groupKey}__ne:${from}`;
        break;

      case "isbetween":
        if (!from || !to) return;
        payload = `${groupKey}__isbetween:${from},${to}`;
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
    <div className="ml-8 flex items-center space-x-2">
      <select
        value={op}
        onChange={(e) => setOp(e.target.value as any)}
        className="border rounded p-1 text-xs"
      >
        <option value="gt">Is after</option>
        <option value="lt">Is before</option>
        <option value="eq">Is on</option>
        <option value="ne">Is not on</option>
        <option value="isbetween">Is between</option>
        <option value="isnull">Is null</option>
        <option value="isnotnull">Is not null</option>
      </select>

      {/* single-date operators */}
      {["gt", "lt", "eq", "ne"].includes(op) && (
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded p-1 text-xs"
        />
      )}

      {/* between */}
      {op === "isbetween" && (
        <>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded p-1 text-xs"
          />
          <span className="text-xs">and</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded p-1 text-xs"
          />
        </>
      )}

      {/* null/notnull show no inputs */}

      <button
        type="button"
        className="ml-8 text-xs font-medium text-custom-primary-100 cursor-pointer"
        onClick={apply}
      >
        Apply
      </button>
    </div>
  );
};
