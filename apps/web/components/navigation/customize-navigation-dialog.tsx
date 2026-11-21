/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CloseOutline, DragDropOutline } from "@makeplane/propel/icons";
// plane imports
import { WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { Field, FieldItem, FieldItemContent } from "@makeplane/propel/components/field";
import {
  Field as InputField,
  FieldError as InputFieldError,
  FieldLabel as InputFieldLabel,
} from "@makeplane/propel/elements/field";
import { RadioGroup } from "@makeplane/propel/components/radio";
import { RadioGroupFieldOption } from "@makeplane/propel/components/radio-group-field";
import { Separator } from "@makeplane/propel/components/separator";
import { Input, InputGroup } from "@makeplane/propel/elements/input";
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

function NavigationSection(props: { title: string; children: ReactNode }) {
  const { title, children } = props;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-body-sm-medium text-primary">{title}</h3>
      {children}
    </section>
  );
}

function SortableCheckboxRow(props: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  const { checked, onCheckedChange, children } = props;
  return (
    // bg keeps the drag preview (portaled outside the list box) opaque.
    <div className="flex items-center rounded-sm bg-layer-1">
      <span className="flex cursor-grab active:cursor-grabbing">
        <Icon icon={DragDropOutline} size="xs" tint="muted" />
      </span>
      {/* The drag handle stays outside the field, so grabbing it does not toggle the item. */}
      <div className="min-w-0 flex-1">
        <Field>
          <FieldItem>
            <span className="flex h-5 shrink-0 items-center">
              <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
            </span>
            <FieldItemContent size="md">{children}</FieldItemContent>
          </FieldItem>
        </Field>
      </div>
    </div>
  );
}

export const CustomizeNavigationDialog = observer(function CustomizeNavigationDialog(
  props: TCustomizeNavigationDialogProps
) {
  const { isOpen, onClose } = props;
  const { t } = useTranslation();
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
      <DialogContent size="sm">
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
            <div className="flex flex-col gap-5">
              {/* Personal Section */}
              <NavigationSection title={t("personal")}>
                <div className="flex flex-col gap-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2">
                  <Sortable
                    data={personalItems}
                    onChange={handlePersonalReorder}
                    keyExtractor={(item) => item.key}
                    id="personal-enabled-items"
                    render={(item) => (
                      <SortableCheckboxRow
                        checked={!!personalPreferences.items[item.key]?.enabled}
                        onCheckedChange={(checked) => togglePersonalItem(item.key, checked)}
                      >
                        {t(item.labelTranslationKey)}
                      </SortableCheckboxRow>
                    )}
                  />
                </div>
              </NavigationSection>

              {/* Workspace Section */}
              <NavigationSection title={t("common.workspace")}>
                <div className="flex flex-col gap-1 rounded-lg border border-subtle bg-layer-1 px-3 py-2">
                  {/* Pinned Items - Draggable */}
                  <Sortable
                    data={workspaceItems}
                    onChange={handleReorder}
                    keyExtractor={(item) => item.key}
                    id="workspace-pinned-items"
                    render={(item) => (
                      <SortableCheckboxRow
                        checked={!!workspacePreferences.items[item.key]?.is_pinned}
                        onCheckedChange={(checked) => handleWorkspaceItemToggle(item.key, checked)}
                      >
                        {t(item.labelTranslationKey)}
                      </SortableCheckboxRow>
                    )}
                  />
                </div>
              </NavigationSection>

              {/* Projects Section */}
              <NavigationSection title={t("projects")}>
                <div className="flex flex-col gap-2 rounded-lg border border-subtle bg-layer-1 px-1 py-2">
                  {/* Navigation Mode Radio Buttons */}
                  {/* RadioGroupFieldOption is a Base UI Field.Item, which throws outside a Field root. */}
                  <Field>
                    <RadioGroup
                      density="comfortable"
                      aria-label={t("projects")}
                      value={projectPreferences.navigationMode}
                      onValueChange={(value) =>
                        void updateNavigationMode(value === "ACCORDION" ? "ACCORDION" : "TABBED")
                      }
                    >
                      <RadioGroupFieldOption
                        size="md"
                        value="ACCORDION"
                        label={t("accordion_navigation_control")}
                        description="Feature tabs will appear as nested items under project and acts as accordion."
                      />
                      <RadioGroupFieldOption
                        size="md"
                        value="TABBED"
                        label={t("horizontal_navigation_bar")}
                        description="Feature tabs will appear as horizontal tabs inside a project."
                      />
                    </RadioGroup>
                  </Field>

                  <div className="px-2">
                    <Separator orientation="horizontal" decorative />
                  </div>

                  {/* Limited Projects Checkbox */}
                  <div className="flex flex-col">
                    <CheckboxField
                      size="md"
                      label={t("show_limited_projects_on_sidebar")}
                      checked={projectPreferences.showLimitedProjects}
                      onCheckedChange={(checked) => void updateShowLimitedProjects(checked)}
                    />

                    {projectPreferences.showLimitedProjects && (
                      // Indented to line up with the "Show limited projects" label above it.
                      <div className="flex flex-col gap-2 pr-2 pb-1 pl-8">
                        <InputField size="md">
                          <InputFieldLabel htmlFor={projectCountId} size="md" inset={false}>
                            {t("enter_number_of_projects")}
                          </InputFieldLabel>
                          <InputGroup size="lg">
                            <Input
                              id={projectCountId}
                              size="lg"
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
                            <InputFieldError id={`${projectCountId}-error`} size="md">
                              Minimum value is 1
                            </InputFieldError>
                          )}
                        </InputField>
                      </div>
                    )}
                  </div>
                </div>
              </NavigationSection>
            </div>
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
