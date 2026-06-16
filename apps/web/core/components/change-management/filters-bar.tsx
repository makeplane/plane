import type { IChangeFilters, TChangePriority, TChangeRisk, TChangeState, TChangeType } from "@/services/change-management.service";

type Props = {
  filters: IChangeFilters;
  onChange: (filters: IChangeFilters) => void;
};

export const FiltersBar = ({ filters, onChange }: Props) => {
  const handleChange = (key: keyof IChangeFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 px-6 border-b border-subtle bg-surface-1">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-secondary">Type:</label>
        <select
          value={filters.type || ""}
          onChange={(e) => handleChange("type", e.target.value)}
          className="rounded border border-subtle px-2 py-1 text-sm bg-transparent"
        >
          <option value="">All</option>
          <option value="normal">Normal</option>
          <option value="standard">Standard</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-secondary">State:</label>
        <select
          value={filters.state || ""}
          onChange={(e) => handleChange("state", e.target.value)}
          className="rounded border border-subtle px-2 py-1 text-sm bg-transparent"
        >
          <option value="">All</option>
          <option value="new">New</option>
          <option value="assess">Assess</option>
          <option value="authorize">Authorize</option>
          <option value="scheduled">Scheduled</option>
          <option value="implement">Implement</option>
          <option value="review">Review</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-secondary">Risk:</label>
        <select
          value={filters.risk || ""}
          onChange={(e) => handleChange("risk", e.target.value)}
          className="rounded border border-subtle px-2 py-1 text-sm bg-transparent"
        >
          <option value="">All</option>
          <option value="1_critical">Critical</option>
          <option value="2_high">High</option>
          <option value="3_moderate">Moderate</option>
          <option value="4_low">Low</option>
        </select>
      </div>
    </div>
  );
};
