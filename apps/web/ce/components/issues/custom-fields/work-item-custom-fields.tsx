import { observer } from "mobx-react";
import { useCallback } from "react";
import { SettingIcon } from "@/components/icons/attachment";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import type { TIssue, TIssueCustomFields } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectCustomFields } from "@/plane-web/hooks/use-project-custom-fields";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
import type { TCustomFieldValue } from "./custom-field-input";
import { CustomFieldInput } from "./custom-field-input";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issue?: TIssue;
  isEditable: boolean;
  issueOperations?: TIssueOperations;
  onLocalChange?: (fields: TIssueCustomFields) => void;
  localValues?: TIssueCustomFields;
};

export const WorkItemCustomFields = observer(function WorkItemCustomFields(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issue: issueProp,
    isEditable,
    issueOperations,
    onLocalChange,
    localValues,
  } = props;

  const { properties, isLoading } = useProjectCustomFields(workspaceSlug, projectId);
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = issueProp ?? getIssueById(issueId);
  const savedFields = issue?.custom_fields;

  const handleChange = useCallback(
    async (key: string, newValue: TCustomFieldValue) => {
      const currentValues = localValues ?? savedFields ?? {};
      const next: TIssueCustomFields = { ...currentValues, [key]: newValue as TIssueCustomFields[string] };

      if (onLocalChange) {
        onLocalChange(next);
        return;
      }

      if (!issueOperations || !isEditable) return;

      await issueOperations.update(workspaceSlug, projectId, issueId, {
        custom_fields: next,
      });
    },
    [localValues, savedFields, onLocalChange, issueOperations, isEditable, workspaceSlug, projectId, issueId]
  );

  const visibleProperties = properties.filter((p) => p.is_active);

  if (isLoading || visibleProperties.length === 0) return null;

  return (
    <>
      {visibleProperties.map((property) => (
        <SidebarPropertyListItem key={property.id} icon={SettingIcon} label={property.name}>
          <CustomFieldInput
            property={property}
            value={
              (localValues?.[property.key] ??
                savedFields?.[property.key] ??
                property.default_value ??
                null) as TCustomFieldValue
            }
            disabled={!isEditable}
            onChange={(val) => {
              void handleChange(property.key, val);
            }}
          />
        </SidebarPropertyListItem>
      ))}
    </>
  );
});
