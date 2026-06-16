import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type {
  IChangeRequest,
  TChangeType,
  TChangeState,
} from "@/services/change-management.service";
import { StateProgress } from "./state-progress";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useUser } from "@/hooks/store/user";
import { useChangeManagement } from "@/hooks/store/use-change-management";

type Props = {
  change?: IChangeRequest;
  type: TChangeType;
  onSubmit: (data: Partial<IChangeRequest>) => void;
  isSubmitting?: boolean;
  nextNumber?: string;
  hideStateBar?: boolean;
};

// --- Constants ---
const CATEGORY_OPTIONS = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "network", label: "Network" },
  { value: "security", label: "Security" },
  { value: "database", label: "Database" },
  { value: "application", label: "Application" },
  { value: "other", label: "Other" },
];
const PRIORITY_OPTIONS = [
  { value: "1_critical", label: "Critical" },
  { value: "2_high", label: "High" },
  { value: "3_moderate", label: "Moderate" },
  { value: "4_low", label: "Low" },
];
const RISK_OPTIONS = PRIORITY_OPTIONS;
const IMPACT_OPTIONS = [
  { value: "1_high", label: "1 - High" },
  { value: "2_medium", label: "2 - Medium" },
  { value: "3_low", label: "3 - Low" },
];
const TYPE_OPTIONS = [
  { value: "normal", label: "Normal (Medium - High Risk)" },
  { value: "standard", label: "Standard (Low Risk)" },
];
const CLOSE_CODE_OPTIONS = [
  { value: "", label: "-- Select --" },
  { value: "successful", label: "Successful" },
  { value: "successful_with_issues", label: "Successful with Issues" },
  { value: "unsuccessful", label: "Unsuccessful" },
  { value: "skipped", label: "Skipped" },
];
const CONFLICT_LABELS: Record<string, { label: string; color: string }> = {
  not_run: { label: "Not Run", color: "bg-layer-1 text-secondary" },
  no_conflicts: { label: "No Conflicts", color: "bg-green-100 text-green-700" },
  conflicts_detected: { label: "Conflicts Detected", color: "bg-red-100 text-red-700" },
  running: { label: "Running…", color: "bg-yellow-100 text-yellow-700" },
};
const TAB_IDS = ["planning", "schedule", "conflicts", "notes", "closure"] as const;
type TabId = (typeof TAB_IDS)[number];
const TAB_LABELS: Record<TabId, string> = {
  planning: "Planning",
  schedule: "Schedule",
  conflicts: "Conflicts",
  notes: "Notes",
  closure: "Closure Information",
};

// --- Reusable sub-components ---
const Field = ({
  label, required, readOnly, children, fullWidth,
}: {
  label: string; required?: boolean; readOnly?: boolean;
  children: React.ReactNode; fullWidth?: boolean;
}) => (
  <div className={`flex items-start gap-1 py-2.5 border-b border-subtle ${fullWidth ? "col-span-2" : ""}`}>
    <label className="w-[180px] flex-shrink-0 text-xs font-medium text-tertiary pt-1.5 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className={`flex-1 min-w-0`}>{children}</div>
  </div>
);

const Input = ({
  value, onChange, readOnly, placeholder, type = "text",
}: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean;
  placeholder?: string; type?: string;
}) => (
  <input
    type={type}
    value={value}
    readOnly={readOnly}
    disabled={readOnly}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    className={`w-full rounded border px-2.5 py-1.5 text-sm transition-colors outline-none
      ${readOnly
        ? "bg-layer-1 border-subtle text-tertiary cursor-not-allowed opacity-80"
        : "bg-surface-1 border-subtle text-primary hover:border-subtle-1 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-placeholder"}`}
  />
);

const Select = ({
  value, onChange, options, readOnly,
}: {
  value: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; readOnly?: boolean;
}) => (
  <select
    value={value}
    disabled={readOnly}
    onChange={(e) => onChange?.(e.target.value)}
    className={`w-full rounded border px-2.5 py-1.5 text-sm transition-colors outline-none
      ${readOnly
        ? "bg-layer-1 border-subtle text-tertiary cursor-not-allowed opacity-80"
        : "bg-surface-1 border-subtle text-primary hover:border-subtle-1 focus:border-primary focus:ring-1 focus:ring-primary"}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value} className="bg-surface-1 text-primary">
        {o.label}
      </option>
    ))}
  </select>
);

const Textarea = ({
  value, onChange, rows = 4, placeholder, readOnly,
}: {
  value: string; onChange?: (v: string) => void; rows?: number;
  placeholder?: string; readOnly?: boolean;
}) => (
  <textarea
    rows={rows}
    value={value}
    readOnly={readOnly}
    disabled={readOnly}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    className={`w-full rounded border px-2.5 py-1.5 text-sm resize-y transition-colors outline-none
      ${readOnly
        ? "bg-layer-1 border-subtle text-tertiary cursor-not-allowed opacity-80"
        : "bg-surface-1 border-subtle text-primary hover:border-subtle-1 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-placeholder"}`}
  />
);

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${color}`}>
    {text}
  </span>
);

// === Main Component ===

// Required fields for submitting a change request
const REQUIRED_FIELDS: { field: string; label: string; tab?: TabId }[] = [
  { field: "short_description", label: "Short Description" },
  { field: "description_html", label: "Description" },
  { field: "category", label: "Category" },
  { field: "assignment_group", label: "Assignment Group" },

  { field: "justification", label: "Justification", tab: "planning" },
  { field: "implementation_plan", label: "Implementation Plan", tab: "planning" },
  { field: "risk_and_impact_analysis", label: "Risk & Impact Analysis", tab: "planning" },
  { field: "backout_plan", label: "Rollback Plan", tab: "planning" },
  { field: "planned_start_date", label: "Planned Start Date", tab: "schedule" },
  { field: "planned_end_date", label: "Planned End Date", tab: "schedule" },
];

function getValidationErrors(data: Partial<IChangeRequest>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { field, label } of REQUIRED_FIELDS) {
    const value = (data as any)[field];
    if (value === undefined || value === null || value === "") {
      errors[field] = `${label} is required.`;
    }
    // Check for placeholder HTML
    if (field === "description_html" && value) {
      const stripped = value.replace(/<[^>]*>/g, "").trim();
      if (!stripped) errors[field] = `${label} cannot be empty.`;
    }
  }
  // Date order
  if (data.planned_start_date && data.planned_end_date && data.planned_start_date >= data.planned_end_date) {
    errors["planned_end_date"] = "Planned End Date must be after Planned Start Date.";
  }
  return errors;
}

function countErrorsOnTab(errors: Record<string, string>, tab: TabId): number {
  return REQUIRED_FIELDS.filter((r) => r.tab === tab && errors[r.field]).length;
}

export const ChangeForm = observer(({ change, type, onSubmit, isSubmitting, nextNumber, hideStateBar }: Props) => {
  const isEdit = !!change;
  const { data: currentUser } = useUser();
  const store = useChangeManagement();
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;

  useEffect(() => {
    if (workspaceSlug) {
      store.fetchAssignmentGroups(workspaceSlug);
    }
  }, [workspaceSlug, store]);

  const [activeTab, setActiveTab] = useState<TabId>("planning");
  const [formData, setFormData] = useState<Partial<IChangeRequest>>(
    change || {
      type,
      state: "new",
      priority: "3_moderate",
      risk: "3_moderate",
      impact: "2_medium",
      category: "other",
      short_description: "",
      description_html: "",
      conflict_status: "not_run",
    }
  );
  // Snapshot of the original change data for dirty-checking (edit mode only)
  const initialSnapshot = useRef<Partial<IChangeRequest> | null>(change ? { ...change } : null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);

  const set = (field: keyof IChangeRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // Live validation (for button state)
  const currentErrors = !isEdit ? getValidationErrors(formData) : {};
  const hasErrors = Object.keys(currentErrors).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit) {
      // Validate before submit
      const errors = getValidationErrors(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setShowErrors(true);
        // Switch to the tab with the first error
        const firstErrorField = Object.keys(errors)[0];
        const reqField = REQUIRED_FIELDS.find((r) => r.field === firstErrorField);
        if (reqField?.tab) setActiveTab(reqField.tab);
        return;
      }

      const CREATE_FIELDS = [
        "type", "priority", "risk", "impact", "category",
        "short_description", "description_html", "service",
        "configuration_item", "assignment_group",
        "justification", "implementation_plan",
        "risk_and_impact_analysis", "backout_plan", "test_plan",
        "planned_start_date", "planned_end_date",
        "cab_required", "cab_date",
      ];
      const payload: Record<string, any> = {};
      for (const key of CREATE_FIELDS) {
        if ((formData as any)[key] !== undefined && (formData as any)[key] !== "") {
          payload[key] = (formData as any)[key];
        }
      }
      payload.short_description = formData.short_description || "";
      onSubmit(payload as Partial<IChangeRequest>);
    } else {
      // Strip locked fields from the payload when not in New state
      // so the backend never receives fields the user can't edit
      const LOCKED_CORE_FIELDS = new Set([
        "category", "service", "configuration_item",
        "priority", "risk", "impact",
        "assignment_group",
        "short_description", "description_html",
      ]);

      let payload: Partial<IChangeRequest>;
      if (currentState !== "new") {
        const filtered: Partial<IChangeRequest> = {};
        for (const [key, value] of Object.entries(formData)) {
          if (!LOCKED_CORE_FIELDS.has(key)) {
            (filtered as any)[key] = value;
          }
        }
        payload = filtered;
      } else {
        payload = formData;
      }

      // ISSUE 2: Dirty-check — only save if at least one field actually changed
      if (initialSnapshot.current) {
        const hasChanges = Object.keys(payload).some((key) => {
          const newVal = String((payload as any)[key] ?? "");
          const oldVal = String((initialSnapshot.current as any)?.[key] ?? "");
          return newVal !== oldVal;
        });
        if (!hasChanges) {
          setToast({
            type: TOAST_TYPE.INFO,
            title: "No changes detected",
            message: "Modify at least one field before saving.",
          });
          return;
        }
      }

      onSubmit(payload);
    }
  };

  const currentState = (formData.state || "new") as TChangeState;
  const currentType = (formData.type || type) as TChangeType;
  const conflictInfo = CONFLICT_LABELS[formData.conflict_status || "not_run"] || CONFLICT_LABELS.not_run;
  const isClosureActive = currentState === "review" || currentState === "closed";

  // ISSUE 2: Core definition fields become read-only after leaving New state
  const isCoreLocked = isEdit && currentState !== "new";

  // ISSUE 1: Actual dates are editable only from Scheduled state onward
  const isActualDatesEditable = isEdit && ["scheduled", "implement", "review"].includes(currentState);

  return (
    <form id="change-management-form" onSubmit={handleSubmit} className="flex flex-col w-full h-full relative">
      {/* State Progress Bar — always visible on create, hidden when embedded in ChangeDetail which has its own */}
      {!hideStateBar && (
        <div className="px-6 pt-4">
          <StateProgress state={currentState} type={currentType} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-subtle bg-surface-1 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {isEdit && (
            <h2 className="text-lg font-bold text-primary font-mono">
              {change.number}
            </h2>
          )}
          <Badge
            text={currentType === "normal" ? "Normal" : "Standard"}
            color={currentType === "normal"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"}
          />
        </div>
        {!isEdit && (
          <div className="flex items-center gap-3">
            {showErrors && hasErrors && (
              <span className="text-xs text-red-500 font-medium">
                {Object.keys(currentErrors).length} required field(s) missing
              </span>
            )}
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              className="shadow-sm"
            >
              Submit Change Request
            </Button>
          </div>
        )}
      </div>

      {/* Validation error summary */}
      {showErrors && hasErrors && !isEdit && (
        <div className="mx-6 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm font-medium text-red-500 mb-1">Please complete all required fields before submitting:</p>
          <ul className="text-xs text-red-400 list-disc pl-4 space-y-0.5">
            {Object.values(fieldErrors).map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 2-Column Header Fields */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-2 gap-x-8">
          {/* Left Column */}
          <div>
            <Field label="Number" readOnly>
              <Input value={isEdit ? change.number : (nextNumber || "CHG-WINJIT-#00001")} readOnly />
            </Field>
            <Field label="Requested by" readOnly>
              {isEdit ? (
                <Input value={change.requested_by_display || "—"} readOnly />
              ) : (
                <div className="flex items-center gap-2 w-full rounded border border-subtle px-2.5 py-1.5 text-sm bg-layer-1 text-tertiary cursor-not-allowed opacity-80 h-[34px]">
                  <Avatar
                    src={getFileURL(currentUser?.avatar_url || "")}
                    name={currentUser?.display_name || "Current User"}
                    size="sm"
                    showTooltip={false}
                  />
                  <span className="truncate">{currentUser?.display_name || "Current User"}</span>
                </div>
              )}
            </Field>
            <Field label="Category" required>
              <Select value={formData.category || "other"} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} readOnly={isCoreLocked} />
              {showErrors && fieldErrors["category"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["category"]}</span>}
            </Field>
            <Field label="Service">
              <Input value={formData.service || ""} onChange={(v) => set("service", v)} placeholder="Affected service…" readOnly={isCoreLocked} />
            </Field>
            <Field label="Configuration Item">
              <Input value={formData.configuration_item || ""} onChange={(v) => set("configuration_item", v)} placeholder="CI name…" readOnly={isCoreLocked} />
            </Field>
            <Field label="Priority" required>
              <Select value={formData.priority || "3_moderate"} onChange={(v) => set("priority", v)} options={PRIORITY_OPTIONS} readOnly={isCoreLocked} />
            </Field>
            <Field label="Risk" required>
              <Select value={formData.risk || "3_moderate"} onChange={(v) => set("risk", v)} options={RISK_OPTIONS} readOnly={isCoreLocked} />
            </Field>
            <Field label="Impact" required>
              <Select value={formData.impact || "2_medium"} onChange={(v) => set("impact", v)} options={IMPACT_OPTIONS} readOnly={isCoreLocked} />
            </Field>
          </div>

          {/* Right Column */}
          <div>
            <Field label="Type" required>
              <Select value={formData.type || type} onChange={(v) => set("type", v)} options={TYPE_OPTIONS} readOnly={isEdit} />
            </Field>
            <Field label="State" readOnly>
              <Input value={currentState.charAt(0).toUpperCase() + currentState.slice(1)} readOnly />
            </Field>
            <Field label="Conflict Status" readOnly>
              <Badge text={conflictInfo.label} color={conflictInfo.color} />
            </Field>
            <Field label="Conflict Last Run" readOnly>
              <Input value={formData.conflict_last_run ? new Date(formData.conflict_last_run).toLocaleString() : "Never"} readOnly />
            </Field>
            <Field label="Assignment Group" required>
              <Select
                value={formData.assignment_group || ""}
                onChange={(v) => set("assignment_group", v)}
                options={[
                  { value: "", label: "-- Select Group --" },
                  ...store.assignmentGroups.filter(g => g.is_active).map(g => ({ value: g.id, label: g.name }))
                ]}
                readOnly={isCoreLocked}
              />
              {showErrors && fieldErrors["assignment_group"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["assignment_group"]}</span>}
            </Field>
          </div>
        </div>

        {/* Full-width fields */}
        <Field label="Short Description" required fullWidth>
          <Input
            value={formData.short_description || ""}
            onChange={(v) => set("short_description", v)}
            placeholder="Brief summary of the change…"
            readOnly={isCoreLocked}
          />
          {showErrors && fieldErrors["short_description"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["short_description"]}</span>}
        </Field>
        <Field label="Description" required fullWidth>
          <Textarea
            value={(() => {
              const raw = formData.description_html || "";
              // Treat empty-looking HTML (e.g. "<p></p>") as truly empty
              // so the placeholder shows instead of literal tags
              const stripped = raw.replace(/<[^>]*>/g, "").trim();
              return stripped ? raw : "";
            })()}
            onChange={(v) => set("description_html", v)}
            rows={3}
            placeholder="Provide a detailed description of this change..."
            readOnly={isCoreLocked}
          />
          {showErrors && fieldErrors["description_html"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["description_html"]}</span>}
        </Field>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-subtle mt-2">
        {TAB_IDS.map((tab) => {
          const disabled = tab === "closure" && !isClosureActive && isEdit;
          const errCount = showErrors && !isEdit ? countErrorsOnTab(fieldErrors, tab) : 0;
          return (
            <button
              key={tab}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5
                ${activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : disabled
                    ? "border-transparent text-placeholder cursor-not-allowed"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
            >
              {TAB_LABELS[tab]}
              {errCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {errCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "planning" && (
          <div className="space-y-4 max-w-4xl">
            {!isEdit && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600">
                <strong>Planning:</strong> All fields below are required before you can submit the change request.
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Justification <span className="text-red-500">*</span></label>
              <Textarea value={formData.justification || ""} onChange={(v) => set("justification", v)} placeholder="Why is this change needed?" />
              {showErrors && fieldErrors["justification"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["justification"]}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Implementation Plan <span className="text-red-500">*</span></label>
              <Textarea value={formData.implementation_plan || ""} onChange={(v) => set("implementation_plan", v)} placeholder="Step-by-step implementation…" />
              {showErrors && fieldErrors["implementation_plan"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["implementation_plan"]}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Risk and Impact Analysis <span className="text-red-500">*</span></label>
              <Textarea value={formData.risk_and_impact_analysis || ""} onChange={(v) => set("risk_and_impact_analysis", v)} placeholder="Risks and their mitigations…" />
              {showErrors && fieldErrors["risk_and_impact_analysis"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["risk_and_impact_analysis"]}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Rollback Plan <span className="text-red-500">*</span></label>
              <Textarea value={formData.backout_plan || ""} onChange={(v) => set("backout_plan", v)} placeholder="Rollback procedure if change fails…" />
              {showErrors && fieldErrors["backout_plan"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["backout_plan"]}</span>}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4 max-w-4xl">
            {!isEdit && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600">
                <strong>Schedule:</strong> Planned start and end dates are required before submission.
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Planned Start Date <span className="text-red-500">*</span></label>
                <Input type="datetime-local" value={formData.planned_start_date ? formData.planned_start_date.slice(0, 16) : ""} onChange={(v) => set("planned_start_date", v || null)} />
                {showErrors && fieldErrors["planned_start_date"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["planned_start_date"]}</span>}
              </div>
              <div>
                <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Planned End Date <span className="text-red-500">*</span></label>
                <Input type="datetime-local" value={formData.planned_end_date ? formData.planned_end_date.slice(0, 16) : ""} onChange={(v) => set("planned_end_date", v || null)} />
                {showErrors && fieldErrors["planned_end_date"] && <span className="text-xs text-red-500 mt-0.5">{fieldErrors["planned_end_date"]}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <label className="text-xs font-medium text-tertiary uppercase tracking-wider">CAB Required</label>
              <button
                type="button"
                onClick={() => set("cab_required", !formData.cab_required)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${formData.cab_required ? "bg-blue-600" : "bg-layer-1"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${formData.cab_required ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
            {formData.cab_required && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">CAB Date</label>
                  <Input type="datetime-local" value={formData.cab_date ? formData.cab_date.slice(0, 16) : ""} onChange={(v) => set("cab_date", v || null)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">CAB Delegate</label>
                  <Input value={formData.cab_delegate || ""} onChange={(v) => set("cab_delegate", v)} placeholder="Delegate name…" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">
                  Actual Start Date{isActualDatesEditable && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <Input type="datetime-local" value={formData.actual_start_date ? formData.actual_start_date.slice(0, 16) : ""} onChange={(v) => set("actual_start_date", v || null)} readOnly={!isActualDatesEditable} />
              </div>
              <div>
                <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">
                  Actual End Date{isActualDatesEditable && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <Input type="datetime-local" value={formData.actual_end_date ? formData.actual_end_date.slice(0, 16) : ""} onChange={(v) => set("actual_end_date", v || null)} readOnly={!isActualDatesEditable} />
              </div>
            </div>
            {formData.cab_required && (
              <div>
                <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">CAB Recommendation</label>
                <Textarea value={formData.cab_recommendation || ""} onChange={(v) => set("cab_recommendation", v)} placeholder="CAB recommendation notes…" />
              </div>
            )}
          </div>
        )}

        {activeTab === "conflicts" && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider w-[140px]">Status</span>
              <Badge text={conflictInfo.label} color={conflictInfo.color} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-tertiary uppercase tracking-wider w-[140px]">Last Run</span>
              <span className="text-sm text-secondary">
                {formData.conflict_last_run ? new Date(formData.conflict_last_run).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="p-4 rounded-lg border border-subtle bg-layer-1">
              <p className="text-sm text-secondary mb-3">
                Run conflict detection to identify scheduling conflicts with other changes in this window.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium border border-subtle text-primary hover:bg-layer-1 transition-colors"
              >
                Run Conflict Detection
              </button>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="max-w-3xl space-y-4">
            <div>
              <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Add a Note</label>
              <Textarea value="" onChange={() => { }} rows={3} placeholder="Type a note or work update…" />
            </div>
            <div className="text-sm text-tertiary italic">
              {isEdit ? "Activity notes will appear here after saving." : "Notes are available after the change is created."}
            </div>
          </div>
        )}

        {activeTab === "closure" && (
          <div className="max-w-3xl space-y-4">
            {!isClosureActive && isEdit ? (
              <div className="p-4 rounded-lg border border-subtle bg-layer-1 text-sm text-secondary">
                Closure information is only editable when the change is in <strong>Review</strong> or <strong>Closed</strong> state.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Close Code</label>
                  <div className="max-w-xs">
                    <Select value={formData.close_code || ""} onChange={(v) => set("close_code", v)} options={CLOSE_CODE_OPTIONS} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-tertiary uppercase tracking-wider mb-1">Close Notes</label>
                  <Textarea value={formData.close_notes || ""} onChange={(v) => set("close_notes", v)} placeholder="Closure summary and notes…" />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
});
