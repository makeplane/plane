/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useId, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CloseOutline, DragDropOutline } from "@makeplane/propel/icons";
// plane imports
import { WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { Input, InputGroup } from "@makeplane/propel/elements/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldItemContent,
  FieldItemControlGroup,
  FieldLabel,
} from "@makeplane/propel/elements/field";
import { Radio, RadioGroup, RadioIndicator } from "@makeplane/propel/elements/radio";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseGroup,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Sortable } from "@plane/blocks/common";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import {
  usePersonalNavigationPreferences,
  useProjectNavigationPreferences,
  useWorkspaceNavigationPreferences,
} from "@/hooks/use-navigation-preferences";
// helpers
import { getSidebarNavigationItemIcon } from "@/components/workspace/sidebar/helper";
// types
import type { TPersonalNavigationItemKey } from "@plane/types";

type TCustomizeNavigationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TWorkspaceNavigationItem = {
  key: string;
  labelTranslationKey: string;
  isPinned: boolean;
  sortOrder: number;
};

const PERSONAL_ITEMS: Array<{ key: TPersonalNavigationItemKey; labelTranslationKey: string }> = [
  { key: "stickies", labelTranslationKey: "sidebar.stickies" },
  { key: "your_work", labelTranslationKey: "sidebar.your_work" },
  { key: "drafts", labelTranslationKey: "drafts" },
];

export const CustomizeNavigationDialog = observer(function CustomizeNavigationDialog(
  props: TCustomizeNavigationDialogProps
) {
  const { isOpen, onClose } = props;
  const { t } = useTranslation();
  const projectModeId = useId();
  const projectCountId = useId();

  // router
  const { workspaceSlug } = useParams();

  // store hooks
  const { allowPermissions } = useUserPermissions();
  const {
    preferences: personalPreferences,
    togglePersonalItem,
    updatePersonalItemOrder,
  } = usePersonalNavigationPreferences();
  const {
    preferences: projectPreferences,
    updateNavigationMode,
    updateShowLimitedProjects,
    updateLimitedProjectsCount,
  } = useProjectNavigationPreferences();
  const {
    preferences: workspacePreferences,
    toggleWorkspaceItem,
    updateWorkspaceItemOrder,
  } = useWorkspaceNavigationPreferences();

  // local state for limited projects count input
  const [projectCountInput, setProjectCountInput] = useState(projectPreferences.limitedProjectsCount.toString());

  // Filter personal items by feature flags
  const filteredPersonalItems = PERSONAL_ITEMS;

  // Filter workspace items by permissions and feature flags, then get pinned/unpinned items
  const workspaceItems = useMemo(() => {
    const items = WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.filter((item) => {
      // Permission check
      const hasPermission = allowPermissions(
        item.access,
        EUserPermissionsLevel.WORKSPACE,
        workspaceSlug?.toString() || ""
      );
      return hasPermission;
    }).map((item) => {
      // Get pinned status and sort order from localStorage
      const preference = workspacePreferences.items[item.key];
      const isPinned = preference?.is_pinned ?? false;
      const sortOrder = preference?.sort_order ?? 0;

      return {
        key: item.key,
        labelTranslationKey: item.labelTranslationKey,
        isPinned,
        sortOrder,
      };
    });

    // oxlint-disable-next-line unicorn/no-array-sort
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [workspaceSlug, allowPermissions, workspacePreferences]);

  // Handle checkbox toggle
  const handleWorkspaceItemToggle = useCallback(
    (itemKey: string, checked: boolean) => {
      toggleWorkspaceItem(itemKey, checked);
    },
    [toggleWorkspaceItem]
  );

  // Handle reorder of pinned workspace items
  const handleReorder = useCallback(
    (newData: TWorkspaceNavigationItem[]) => {
      const itemsWithOrder = newData.map((item, index) => ({
        key: item.key,
        sortOrder: index,
      }));
      updateWorkspaceItemOrder(itemsWithOrder);
    },
    [updateWorkspaceItemOrder]
  );

  // Handle reorder of enabled personal items
  const handlePersonalReorder = useCallback(
    (newData: Array<{ key: TPersonalNavigationItemKey; labelTranslationKey: string }>) => {
      const itemsWithOrder = newData.map((item, index) => ({
        key: item.key,
        sortOrder: index,
      }));
      updatePersonalItemOrder(itemsWithOrder);
    },
    [updatePersonalItemOrder]
  );

  // Separate personal items into enabled/disabled
  const personalItems = useMemo(() => {
    const items = filteredPersonalItems.map((item) => {
      const itemState = personalPreferences.items[item.key];
      const isEnabled = typeof itemState === "boolean" ? itemState : (itemState?.enabled ?? true);
      const sortOrder = typeof itemState === "boolean" ? 0 : (itemState?.sort_order ?? 0);

      return {
        ...item,
        isEnabled,
        sortOrder,
      };
    });

    // oxlint-disable-next-line unicorn/no-array-sort
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [personalPreferences, filteredPersonalItems]);

  // Prevent typing invalid characters in number input
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block: e, E, +, -, .
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Handle project count input change
  const handleProjectCountChange = (value: string) => {
    // Strip any non-digit characters
    const cleanedValue = value.replace(/\D/g, "");
    setProjectCountInput(cleanedValue);

    // Parse and validate the value
    const numValue = parseInt(cleanedValue, 10);

    // If valid number, enforce minimum of 1
    if (!isNaN(numValue)) {
      const validValue = Math.max(1, numValue);
      updateLimitedProjectsCount(validValue);
    }
  };

  return (
    <Dialog
      open={isOpen}
      // The legacy ModalCore closed on Escape and outside click via `handleClose`, so default dismissal stays.
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <DialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            icon={<Icon icon={CloseOutline} />}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        <DialogMain>
          {/* Header */}
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("customize_navigation")}</DialogTitle>
              <DialogDescription>
                Selected items will always stay visible in your sidebar. You can still find the others anytime from the
                More menu. These changes are personal to you and won&apos;t affect anyone else on your workspace.
              </DialogDescription>
            </DialogHeading>
          </DialogHeader>

          {/* Content */}
          <DialogBody tabIndex={0}>
            <div className="space-y-4">
              {/* Personal Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-body-xs-semibold text-placeholder">{t("personal")}</h3>
                <div className="rounded-md border border-subtle bg-surface-2 py-2">
                  <Sortable
                    data={personalItems}
                    onChange={handlePersonalReorder}
                    keyExtractor={(item) => item.key}
                    id="personal-enabled-items"
                    render={(item) => (
                      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 hover:bg-surface-2">
                        <DragDropOutline className="size-4 cursor-grab text-placeholder transition-colors active:cursor-grabbing" />
                        <Checkbox
                          checked={!!personalPreferences.items[item.key]?.enabled}
                          onCheckedChange={(checked) => togglePersonalItem(item.key, checked)}
                          aria-label={t(item.labelTranslationKey)}
                        />
                        <div className="flex flex-1 items-center gap-2">
                          {getSidebarNavigationItemIcon(item.key)}
                          <label className="flex-1 cursor-pointer text-body-xs-regular text-primary">
                            {t(item.labelTranslationKey)}
                          </label>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Workspace Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-body-xs-semibold text-placeholder">{t("common.workspace")}</h3>
                <div className="rounded-md border border-subtle bg-surface-2 py-2">
                  {/* Pinned Items - Draggable */}
                  <Sortable
                    data={workspaceItems}
                    onChange={handleReorder}
                    keyExtractor={(item) => item.key}
                    id="workspace-pinned-items"
                    render={(item) => {
                      const icon = getSidebarNavigationItemIcon(item.key);
                      return (
                        <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 hover:bg-surface-2">
                          <DragDropOutline className="size-4 cursor-grab text-placeholder transition-colors active:cursor-grabbing" />
                          <Checkbox
                            checked={!!workspacePreferences.items[item.key]?.is_pinned}
                            onCheckedChange={(checked) => handleWorkspaceItemToggle(item.key, checked)}
                            aria-label={t(item.labelTranslationKey)}
                          />
                          <div className="flex flex-1 items-center gap-2">
                            {icon}
                            <span className="text-body-xs-regular text-primary">{t(item.labelTranslationKey)}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Projects Section */}
              <div className="flex flex-col gap-2">
                <h3 className="text-body-xs-semibold text-placeholder">{t("projects")}</h3>

                <div className="rounded-md border border-subtle bg-surface-2 px-2 py-2">
                  <div className="space-y-3">
                    {/* Navigation Mode Radio Buttons */}
                    <RadioGroup density="comfortable" role="radiogroup" aria-label={t("projects")}>
                      {[
                        {
                          value: "ACCORDION" as const,
                          label: t("accordion_navigation_control"),
                          description: "Feature tabs will appear as nested items under project and acts as accordion.",
                        },
                        {
                          value: "TABBED" as const,
                          label: t("horizontal_navigation_bar"),
                          description: "Feature tabs will appear as horizontal tabs inside a project.",
                        },
                      ].map(({ value, label, description }) => (
                        <FieldItem
                          key={value}
                          render={
                            <label
                              htmlFor={`${projectModeId}-${value}`}
                              aria-labelledby={`${projectModeId}-${value}-label`}
                            />
                          }
                        >
                          <FieldItemControlGroup>
                            <span className="relative flex shrink-0 items-center justify-center">
                              <Radio
                                data-checked={projectPreferences.navigationMode === value ? "" : undefined}
                                render={
                                  <input
                                    id={`${projectModeId}-${value}`}
                                    type="radio"
                                    name="navigation-mode"
                                    value={value}
                                    checked={projectPreferences.navigationMode === value}
                                    onChange={() => updateNavigationMode(value)}
                                    aria-labelledby={`${projectModeId}-${value}-label`}
                                    aria-describedby={`${projectModeId}-${value}-description`}
                                    className="cursor-pointer appearance-none"
                                  />
                                }
                              />
                              {projectPreferences.navigationMode === value && (
                                <RadioIndicator
                                  aria-hidden="true"
                                  render={<span className="pointer-events-none absolute text-icon-accent-primary" />}
                                />
                              )}
                            </span>
                          </FieldItemControlGroup>
                          <FieldItemContent>
                            <FieldLabel
                              size="md"
                              inset={false}
                              id={`${projectModeId}-${value}-label`}
                              render={<span />}
                            >
                              {label}
                            </FieldLabel>
                            <FieldDescription size="md" id={`${projectModeId}-${value}-description`} render={<span />}>
                              {description}
                            </FieldDescription>
                          </FieldItemContent>
                        </FieldItem>
                      ))}
                    </RadioGroup>

                    {/* Limited Projects Checkbox */}
                    <div className="space-y-1">
                      <div className="rounded-md px-2 py-1.5 hover:bg-surface-2">
                        <Checkbox
                          label={t("show_limited_projects_on_sidebar")}
                          stretch="full"
                          checked={projectPreferences.showLimitedProjects}
                          onCheckedChange={updateShowLimitedProjects}
                        />
                      </div>

                      {projectPreferences.showLimitedProjects && (
                        <div className="pl-8">
                          <Field size="md">
                            <FieldLabel htmlFor={projectCountId} size="md" inset={false}>
                              {t("enter_number_of_projects")}
                            </FieldLabel>
                            <InputGroup size="md">
                              <Input
                                id={projectCountId}
                                size="md"
                                type="number"
                                min="1"
                                step="1"
                                value={projectCountInput}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => handleProjectCountChange(e.target.value)}
                                aria-invalid={
                                  parseInt(projectCountInput) < 1 && projectCountInput !== "" ? true : undefined
                                }
                                aria-describedby={
                                  parseInt(projectCountInput) < 1 && projectCountInput !== ""
                                    ? `${projectCountId}-error`
                                    : undefined
                                }
                                data-invalid={parseInt(projectCountInput) >= 1 ? undefined : ""}
                              />
                            </InputGroup>
                            {parseInt(projectCountInput) < 1 && projectCountInput !== "" && (
                              <FieldError id={`${projectCountId}-error`} size="md">
                                Minimum value is 1
                              </FieldError>
                            )}
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
