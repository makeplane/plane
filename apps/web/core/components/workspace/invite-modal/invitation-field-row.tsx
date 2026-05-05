/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import type { Control, FormState } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
// plane imports
import { ROLE } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import type { IUserLite } from "@plane/types";
import { CustomSelect, Input } from "@plane/ui";
// hooks
import useDebounce from "@/hooks/use-debounce";
import type { InvitationFormValues } from "@/hooks/use-workspace-invitation";
// services
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import { EmailAutocompleteDropdown } from "./email-autocomplete-dropdown";
import { SelectedUserDisplay } from "./selected-user-display";

const workspaceService = new WorkspaceService();

type TInvitationFieldRowProps = {
  index: number;
  workspaceSlug: string;
  control: Control<InvitationFormValues>;
  errors: FormState<InvitationFormValues>["errors"];
  remove: (index: number) => void;
  showRemoveButton: boolean;
  currentWorkspaceRole?: number;
};

export const InvitationFieldRow = observer(function InvitationFieldRow(props: TInvitationFieldRowProps) {
  const { index, workspaceSlug, control, errors, remove, showRemoveButton, currentWorkspaceRole } = props;
  // state
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  // raw suggestions from API (before duplicate exclusion)
  const [rawSuggestions, setRawSuggestions] = useState<IUserLite[]>([]);
  // selected user from dropdown — shows rich chip instead of raw email
  const [selectedUser, setSelectedUser] = useState<IUserLite | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  // hooks
  const { t } = useTranslation();
  // watch live email values: current field for debounce, all fields for duplicate exclusion
  const allEmailFields = useWatch({ control, name: "emails" }) ?? [];
  const emailValue = allEmailFields[index]?.email ?? "";
  const debouncedEmail = useDebounce(emailValue, 300);
  // close dropdown when clicking outside the field wrapper
  useOutsideClickDetector(fieldRef, () => setShowDropdown(false));

  // clear selected user when email is cleared (e.g., form reset)
  useEffect(() => {
    if (!emailValue) setSelectedUser(null);
  }, [emailValue]);

  // search platform users when debounced query changes
  useEffect(() => {
    if (debouncedEmail.length < 2) {
      setRawSuggestions([]);
      return;
    }
    workspaceService
      .searchUsersForInvite(workspaceSlug, debouncedEmail)
      .then((users) => setRawSuggestions(users))
      .catch(() => setRawSuggestions([]));
  }, [debouncedEmail, workspaceSlug]);

  // memoize other rows' emails to avoid re-creating on every render
  const otherEmails = useMemo(() => {
    const emails = (allEmailFields ?? [])
      .filter((_, i) => i !== index)
      .map((f) => f?.email)
      .filter(Boolean);
    return new Set(emails);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allEmailFields reference changes per render; stringify for stable comparison
  }, [JSON.stringify(allEmailFields), index]);

  // filter out emails already entered in other invitation rows
  const suggestions = useMemo(
    () => rawSuggestions.filter((user) => user.email && !otherEmails.has(user.email)).slice(0, 5),
    [rawSuggestions, otherEmails]
  );

  return (
    <div className="relative group mb-1 flex items-start justify-between gap-x-4 text-body-xs-regular w-full">
      {/* email input with autocomplete */}
      <div ref={fieldRef} className="relative min-w-0 flex-1">
        <Controller
          control={control}
          name={`emails.${index}.email`}
          rules={{
            required: t("workspace_settings.settings.members.modal.errors.required"),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t("workspace_settings.settings.members.modal.errors.invalid"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <>
              {selectedUser ? (
                <SelectedUserDisplay
                  user={selectedUser}
                  onClear={() => {
                    setSelectedUser(null);
                    onChange("");
                  }}
                />
              ) : (
                <>
                  <Input
                    id={`emails.${index}.email`}
                    name={`emails.${index}.email`}
                    type="text"
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      setShowDropdown(true);
                      setActiveSuggestion(-1);
                    }}
                    onKeyDown={(e) => {
                      if (!showDropdown || debouncedEmail.length < 2) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveSuggestion((i) => Math.max(i - 1, -1));
                      } else if (e.key === "Enter" && activeSuggestion >= 0) {
                        e.preventDefault();
                        const user = suggestions[activeSuggestion];
                        onChange(user.email ?? "");
                        setSelectedUser(user);
                        setShowDropdown(false);
                        setActiveSuggestion(-1);
                      } else if (e.key === "Escape") {
                        setShowDropdown(false);
                      }
                    }}
                    ref={ref}
                    hasError={Boolean(errors.emails?.[index]?.email)}
                    placeholder={t("workspace_settings.settings.members.modal.placeholder")}
                    className="w-full text-caption-sm-regular sm:text-body-xs-regular"
                  />
                  {errors.emails?.[index]?.email && (
                    <span className="ml-1 text-caption-sm-regular text-danger-primary">
                      {errors.emails?.[index]?.email?.message}
                    </span>
                  )}
                  {showDropdown && debouncedEmail.length >= 2 && (
                    <EmailAutocompleteDropdown
                      suggestions={suggestions}
                      activeIndex={activeSuggestion}
                      onSelect={(user) => {
                        onChange(user.email ?? "");
                        setSelectedUser(user);
                        setShowDropdown(false);
                        setActiveSuggestion(-1);
                      }}
                      onHover={setActiveSuggestion}
                    />
                  )}
                </>
              )}
            </>
          )}
        />
      </div>
      {/* role selector + auto join checkbox + remove button */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex flex-col gap-1">
          <Controller
            control={control}
            name={`emails.${index}.role`}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <CustomSelect
                value={value}
                label={<span className="text-caption-sm-regular sm:text-body-xs-regular">{ROLE[value]}</span>}
                onChange={onChange}
                className="flex-grow w-24"
                input
              >
                {Object.entries(ROLE).map(([key, roleValue]) => {
                  if (currentWorkspaceRole && currentWorkspaceRole >= parseInt(key))
                    return (
                      <CustomSelect.Option key={key} value={parseInt(key)}>
                        {roleValue}
                      </CustomSelect.Option>
                    );
                })}
              </CustomSelect>
            )}
          />
        </div>
        {/* Auto Join: directly adds member without invitation email */}
        <Controller
          control={control}
          name={`emails.${index}.auto_join`}
          render={({ field: { value, onChange } }) => (
            <label className="flex cursor-pointer items-center gap-1.5 text-caption-sm-regular text-secondary whitespace-nowrap">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent-primary"
              />
              Auto Join
            </label>
          )}
        />
        {showRemoveButton && (
          <div className="flex-item flex w-6">
            <button type="button" className="place-items-center self-center rounded-sm" onClick={() => remove(index)}>
              <CloseIcon className="h-4 w-4 text-secondary" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
