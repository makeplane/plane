import type { TIssueProperty, TIssuePropertyOption } from "@plane/types";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";

export type TCustomFieldValue = string | number | boolean | string[] | null | undefined;

type Props = {
  property: TIssueProperty;
  value: TCustomFieldValue;
  onChange: (value: TCustomFieldValue) => void;
  disabled?: boolean;
  className?: string;
};

export function CustomFieldInput({ property, value, onChange, disabled, className }: Props) {
  const type = property.property_type;

  if (type === "boolean") {
    return (
      <label className={cn("flex h-7.5 cursor-pointer items-center gap-2", className)}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-subtle"
        />
        <span className="text-body-xs-regular text-secondary">{value ? "Yes" : "No"}</span>
      </label>
    );
  }

  if (type === "select") {
    return (
      <select
        value={value != null ? String(value) : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "h-7.5 w-full rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary",
          className
        )}
      >
        <option value="">—</option>
        {property.options?.map((opt: TIssuePropertyOption) => (
          <option key={opt.value} value={opt.value}>
            {opt.value}
          </option>
        ))}
      </select>
    );
  }

  if (type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        {property.options?.map((opt: TIssuePropertyOption) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = isSelected ? selected.filter((v) => v !== opt.value) : [...selected, opt.value];
                onChange(next.length ? next : null);
              }}
              className={cn(
                "rounded-sm border px-2 py-0.5 text-11 font-medium",
                isSelected
                  ? "border-strong bg-layer-transparent-active text-primary"
                  : "border-subtle bg-surface-2 text-secondary hover:bg-layer-transparent-hover"
              )}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "number") {
    return (
      <Input
        type="number"
        value={value != null && value !== "" ? String(value) : ""}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className={cn("h-7.5 w-full text-body-xs-regular", className)}
        placeholder={property.name}
      />
    );
  }

  if (type === "date") {
    return (
      <Input
        type="date"
        value={value != null ? String(value) : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn("h-7.5 w-full text-body-xs-regular", className)}
      />
    );
  }

  return (
    <Input
      type="text"
      value={value != null ? String(value) : ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn("h-7.5 w-full text-body-xs-regular", className)}
      placeholder={property.name}
    />
  );
}
