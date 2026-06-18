/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EditIcon } from "@plane/propel/icons";
import { ECustomFieldType } from "@plane/types";
import type { TCustomFieldRawValue, TCustomFieldWithValue } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// hooks
import { useIssueCustomFields } from "@/hooks/use-issue-custom-fields";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { CustomFieldInput, getUrlValue } from "./custom-field-input";
import { customFieldHasValue, CustomFieldValueDisplay } from "./custom-field-value-display";
import { FieldTypeIcon } from "./field-type-icon";

// field types that commit + close on a single change (discrete single-value pickers)
const COMMIT_AND_EXIT = new Set<ECustomFieldType>([
  ECustomFieldType.SINGLE_SELECT,
  ECustomFieldType.RADIO,
  ECustomFieldType.BOOLEAN,
  ECustomFieldType.DATE,
  ECustomFieldType.DATETIME,
]);

const openExternal = (rawUrl: string) => {
  if (!rawUrl) return;
  const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  window.open(href, "_blank", "noopener,noreferrer");
};

type RowProps = {
  field: TCustomFieldWithValue;
  canEdit: boolean;
  onSave: (fieldId: string, value: TCustomFieldRawValue) => void;
};

function PropertyEditRow({ field, canEdit, onSave }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<TCustomFieldRawValue>(field.value);
  const savedRef = useRef<TCustomFieldRawValue>(field.value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(field.value);
    savedRef.current = field.value;
  }, [field.value, field.id]);

  useEffect(() => {
    if (editing) wrapperRef.current?.querySelector<HTMLElement>("input, textarea")?.focus();
  }, [editing]);

  const commitIfChanged = (next: TCustomFieldRawValue) => {
    if (JSON.stringify(next) !== JSON.stringify(savedRef.current)) {
      savedRef.current = next;
      onSave(field.id, next);
    }
  };

  const commitsOnChange = COMMIT_AND_EXIT.has(field.field_type);
  const isMulti = field.field_type === ECustomFieldType.MULTI_SELECT;
  const isHyperlink = field.field_type === ECustomFieldType.URL;
  const linkUrl = isHyperlink ? getUrlValue(field.value).url : "";
  const clickable = canEdit || (isHyperlink && Boolean(linkUrl));

  const Icon = (props: { className?: string }) => <FieldTypeIcon type={field.field_type} className={props.className} />;

  if (editing) {
    return (
      <SidebarPropertyListItem icon={Icon} label={field.display_name}>
        <div
          ref={wrapperRef}
          className="w-full"
          onBlur={
            commitsOnChange
              ? undefined
              : () => {
                  commitIfChanged(value);
                  setEditing(false);
                }
          }
        >
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => {
              setValue(next);
              if (commitsOnChange) {
                commitIfChanged(next);
                setEditing(false);
              } else if (isMulti) {
                commitIfChanged(next);
              }
            }}
          />
        </div>
      </SidebarPropertyListItem>
    );
  }

  return (
    <SidebarPropertyListItem icon={Icon} label={field.display_name}>
      <button
        type="button"
        disabled={!clickable}
        onClick={() => {
          if (canEdit) setEditing(true);
          else if (isHyperlink) openExternal(linkUrl);
        }}
        className={cn(
          "group flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-body-xs-regular text-primary transition-colors outline-none",
          clickable ? "hover:bg-layer-transparent-hover" : "cursor-default"
        )}
      >
        <CustomFieldValueDisplay field={field} value={field.value} />
        <span className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {isHyperlink && linkUrl && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openExternal(linkUrl);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openExternal(linkUrl);
              }}
              className="grid size-4 place-items-center text-tertiary hover:text-primary"
            >
              <ExternalLink className="size-3.5" />
            </button>
          )}
          {canEdit && <EditIcon className="size-3 shrink-0 text-tertiary" />}
        </span>
      </button>
    </SidebarPropertyListItem>
  );
}

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

/** Sidebar Properties: shows only custom fields that have a value, as rendered text.
 *  The edit affordance (pencil) appears on hover only for users allowed to edit the
 *  field; the full editor for all fields lives in the Custom Fields tab. */
export const IssueCustomFieldsProperties = observer(function IssueCustomFieldsProperties(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const { allowPermissions } = useUserPermissions();
  const { fields, saveField } = useIssueCustomFields({ workspaceSlug, projectId, issueId });

  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  const filledFields = fields.filter((field) => customFieldHasValue(field.value));
  if (filledFields.length === 0) return null;

  return (
    <>
      {filledFields.map((field) => {
        const canEdit = !disabled && (!field.admin_only || isWorkspaceAdmin);
        return <PropertyEditRow key={field.id} field={field} canEdit={canEdit} onSave={saveField} />;
      })}
    </>
  );
});
