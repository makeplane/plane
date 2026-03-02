/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { GripVertical, X } from "lucide-react";
// plane imports
import { WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Checkbox, EModalPosition, EModalWidth, ModalCore, Sortable } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import {
  usePersonalNavigationPreferences,
  useProjectNavigationPreferences,
  useWorkspaceNavigationPreferences,
} from "@/hooks/use-navigation-preferences";
// helpers
import { getSidebarNavigationItemIcon } from "@/plane-web/components/workspace/sidebar/helper";
// types
import type { TPersonalNavigationItemKey } from "@/types/navigation-preferences";

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

    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [personalPreferences, filteredPersonalItems]);

  // Prevent typing invalid characters in number input
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
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex max-h-[90vh] flex-col rounded-lg bg-surface-1">
        {/* Header */}
        <div className="flex justify-between px-6 pt-4">
          <div>
            <h2 className="text-18 font-semibold text-primary">{t("customize_navigation")}</h2>
            <p className="mt-1 text-13 text-tertiary">
              Selected items will always stay visible in your sidebar. You can still find the others anytime from the
              More menu. These changes are personal to you and won&apos;t affect anyone else on your workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-5 flex-shrink-0 items-center justify-center rounded-sm text-placeholder hover:bg-layer-1"
            aria-label={t("close")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* Personal Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-13 font-semibold text-placeholder">{t("personal")}</h3>
            <div className="rounded-md border border-subtle bg-surface-2 py-2">
              <Sortable
                data={personalItems}
                onChange={handlePersonalReorder}
                keyExtractor={(item) => item.key}
                id="personal-enabled-items"
                render={(item) => (
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 hover:bg-surface-2">
                    <GripVertical className="size-4 cursor-grab text-placeholder transition-colors active:cursor-grabbing" />
                    <Checkbox
                      checked={!!personalPreferences.items[item.key]?.enabled}
                      onChange={(e) => togglePersonalItem(item.key, e.target.checked)}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      {getSidebarNavigationItemIcon(item.key)}
                      <label className="flex-1 cursor-pointer text-13 text-primary">
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
            <h3 className="text-13 font-semibold text-placeholder">{t("workspace")}</h3>
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
                      <GripVertical className="size-4 cursor-grab text-placeholder transition-colors active:cursor-grabbing" />
                      <Checkbox
                        checked={!!workspacePreferences.items[item.key]?.is_pinned}
                        onChange={(e) => handleWorkspaceItemToggle(item.key, e.target.checked)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        {icon}
                        <span className="text-13 text-primary">{t(item.labelTranslationKey)}</span>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>

          {/* Projects Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-13 font-semibold text-placeholder">{t("projects")}</h3>

            <div className="rounded-md border border-subtle bg-surface-2 px-2 py-2">
              <div className="space-y-3">
                {/* Navigation Mode Radio Buttons */}
                <div className="space-y-2">
                  <label className="flex cursor-pointer gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
                    <input
                      type="radio"
                      name="navigation-mode"
                      value="ACCORDION"
                      checked={projectPreferences.navigationMode === "ACCORDION"}
                      onChange={() => updateNavigationMode("ACCORDION")}
                      className="mt-1 size-4 text-accent-primary focus:ring-accent-strong"
                    />
                    <div className="flex-1">
                      <div className="text-13 text-primary">{t("accordion_navigation_control")}</div>
                      <div className="text-11 text-secondary">
                        Feature tabs will appear as nested items under project and acts as accordion.
                      </div>
                    </div>
                  </label>

                  <label className="flex cursor-pointer gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
                    <input
                      type="radio"
                      name="navigation-mode"
                      value="TABBED"
                      checked={projectPreferences.navigationMode === "TABBED"}
                      onChange={() => updateNavigationMode("TABBED")}
                      className="mt-1 size-4 text-accent-primary focus:ring-accent-strong"
                    />
                    <div className="flex-1">
                      <div className="text-13 text-primary">{t("horizontal_navigation_bar")}</div>
                      <div className="text-11 text-secondary">
                        Feature tabs will appear as horizontal tabs inside a project.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Limited Projects Checkbox */}
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
                    <Checkbox
                      checked={projectPreferences.showLimitedProjects}
                      onChange={(e) => updateShowLimitedProjects(e.target.checked)}
                    />
                    <span className="text-13 text-primary">{t("show_limited_projects_on_sidebar")}</span>
                  </label>

                  {projectPreferences.showLimitedProjects && (
                    <div className="pl-8">
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex w-full flex-col gap-2 pb-1.5">
                          <label className="w-full text-11 text-secondary">{t("enter_number_of_projects")}</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={projectCountInput}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => handleProjectCountChange(e.target.value)}
                            className={cn(
                              "w-full rounded-md px-2 py-1 text-13",
                              "border bg-surface-2",
                              "text-secondary",
                              parseInt(projectCountInput) >= 1
                                ? "border-strong focus:border-accent-strong focus:ring-1 focus:ring-accent-strong"
                                : "border-danger-strong focus:border-danger-strong focus:ring-1 focus:ring-danger-strong"
                            )}
                          />
                        </div>
                        {parseInt(projectCountInput) < 1 && projectCountInput !== "" && (
                          <span className="pl-0.5 text-11 text-danger-primary">Minimum value is 1</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
