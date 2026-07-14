"use client";

import { Search, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { CustomSelect, Input } from "@plane/ui";
import type { MatrixFilterOption, MatrixFilterOptions, MatrixFilterState } from "../types/matrix.types";

type MatrixFiltersProps = {
  disabled?: boolean;
  filters: MatrixFilterState;
  hasActiveFilters: boolean;
  onChange: (filters: MatrixFilterState) => void;
  onClear: () => void;
  options: MatrixFilterOptions;
};

type ArrayFilterKey = "categories" | "periods" | "players" | "teams";

type MatrixFilterSelectProps = {
  allLabel: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: MatrixFilterOption[];
  value: string;
};

const MatrixFilterSelect = ({ allLabel, disabled, label, onChange, options, value }: MatrixFilterSelectProps) => {
  if (options.length === 0) return null;

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <CustomSelect
      buttonClassName="h-8 min-w-28 max-w-44 bg-custom-background-100 text-custom-text-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100"
      disabled={disabled}
      label={
        <span className="truncate">
          <span className="sr-only">{label} filter: </span>
          {selectedLabel ?? label}
        </span>
      }
      maxHeight="lg"
      onChange={(nextValue: string) => onChange(nextValue)}
      optionsClassName="min-w-44"
      value={value}
    >
      <CustomSelect.Option value="">{allLabel}</CustomSelect.Option>
      {options.map((option) => (
        <CustomSelect.Option key={option.value} value={option.value}>
          <span className="max-w-52 truncate" title={option.label}>
            {option.label}
          </span>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};

export const MatrixFilters = ({
  disabled = false,
  filters,
  hasActiveFilters,
  onChange,
  onClear,
  options,
}: MatrixFiltersProps) => {
  const updateArrayFilter = (key: ArrayFilterKey, value: string) =>
    onChange({ ...filters, [key]: value ? [value] : [] });

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" aria-label="Matrix filters">
      <label className="relative block w-48 min-w-40 sm:w-56">
        <span className="sr-only">Search matrix tags</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-custom-text-400"
        />
        <Input
          aria-label="Search matrix tags"
          className="h-8 w-full pl-8 text-xs text-custom-text-100"
          disabled={disabled}
          inputSize="xs"
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search tags"
          value={filters.search}
        />
      </label>
      <MatrixFilterSelect
        allLabel="All teams"
        disabled={disabled}
        label="Team"
        onChange={(value) => updateArrayFilter("teams", value)}
        options={options.teams}
        value={filters.teams[0] ?? ""}
      />
      <MatrixFilterSelect
        allLabel="All participants"
        disabled={disabled}
        label="Participant"
        onChange={(value) => updateArrayFilter("players", value)}
        options={options.players}
        value={filters.players[0] ?? ""}
      />
      <MatrixFilterSelect
        allLabel="All categories"
        disabled={disabled}
        label="Category"
        onChange={(value) => updateArrayFilter("categories", value)}
        options={options.categories}
        value={filters.categories[0] ?? ""}
      />
      <MatrixFilterSelect
        allLabel="All periods"
        disabled={disabled}
        label="Period"
        onChange={(value) => updateArrayFilter("periods", value)}
        options={options.periods}
        value={filters.periods[0] ?? ""}
      />
      {hasActiveFilters ? (
        <Button
          aria-label="Clear matrix filters"
          disabled={disabled}
          onClick={onClear}
          prependIcon={<X />}
          size="sm"
          variant="link-neutral"
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
};
