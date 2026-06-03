import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueProperty, TIssuePropertyPayload, TIssuePropertyType } from "@plane/types";
import { Button, Input } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { getProjectCustomFieldsKey, useProjectCustomFields } from "@/plane-web/hooks/use-project-custom-fields";
import { mutate } from "swr";

const PROPERTY_TYPES: { value: TIssuePropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi select" },
];

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectSettingsCustomFields = observer(function ProjectSettingsCustomFields(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { properties, isLoading, issuePropertyService } = useProjectCustomFields(workspaceSlug, projectId);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<TIssuePropertyType>("text");
  const [optionsText, setOptionsText] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  if (!canManage) {
    return <NotAuthorizedView />;
  }

  const refresh = () => mutate(getProjectCustomFieldsKey(workspaceSlug, projectId));

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: TIssuePropertyPayload = {
        name: name.trim(),
        property_type: propertyType,
        is_required: isRequired,
      };
      if (propertyType === "select" || propertyType === "multi_select") {
        payload.options = optionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((value) => ({ value }));
      }
      await issuePropertyService.createProperty(workspaceSlug, projectId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: "Custom field created",
      });
      setName("");
      setOptionsText("");
      setShowForm(false);
      await refresh();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create custom field";
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error.label"), message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (property: TIssueProperty) => {
    if (!window.confirm(`Delete custom field "${property.name}"?`)) return;
    try {
      await issuePropertyService.deleteProperty(workspaceSlug, projectId, property.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: "Custom field deleted",
      });
      await refresh();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: "Failed to delete custom field",
      });
    }
  };

  return (
    <SettingsContentWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h4-medium">Custom fields</h3>
            <p className="mt-1 text-body-sm-regular text-tertiary">
              Define custom fields for work items in {currentProjectDetails?.name ?? "this project"}.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add field"}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 rounded-lg border border-subtle bg-surface-1 p-4">
            <div>
              <label htmlFor="custom-field-name" className="text-body-xs-medium text-secondary">
                Name
              </label>
              <Input
                id="custom-field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Story points"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="custom-field-type" className="text-body-xs-medium text-secondary">
                Type
              </label>
              <select
                id="custom-field-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as TIssuePropertyType)}
                className="mt-1 h-9 w-full rounded-sm border border-subtle bg-surface-1 px-2 text-body-sm-regular"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            {(propertyType === "select" || propertyType === "multi_select") && (
              <div>
                <label htmlFor="custom-field-options" className="text-body-xs-medium text-secondary">
                  Options (comma-separated)
                </label>
                <Input
                  id="custom-field-options"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option A, Option B"
                  className="mt-1"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-body-sm-regular">
              <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
              Required on new work items
            </label>
            <Button
              variant="primary"
              onClick={() => {
                void handleCreate();
              }}
              loading={isSubmitting}
            >
              Create field
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-body-sm-regular text-tertiary">Loading…</p>
        ) : properties.length === 0 ? (
          <p className="text-body-sm-regular text-tertiary">No custom fields yet. Add one to get started.</p>
        ) : (
          <div className="divide-y divide-subtle rounded-lg border border-subtle">
            {properties.map((property) => (
              <div key={property.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-body-sm-medium">{property.name}</p>
                  <p className="text-11 text-tertiary">
                    {property.key} · {property.property_type}
                    {property.is_required ? " · required" : ""}
                  </p>
                </div>
                <Button
                  variant="link-neutral"
                  onClick={() => {
                    void handleDelete(property);
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
});
