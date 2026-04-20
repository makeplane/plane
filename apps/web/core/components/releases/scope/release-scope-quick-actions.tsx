/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore, ContextMenu, CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
import { XCircle } from "lucide-react";
import type { IQuickActionProps } from "@/components/issues/issue-layouts/list/list-view-types";

export const ReleaseScopeQuickActions = observer(function ReleaseScopeQuickActions(props: IQuickActionProps) {
  const { handleDelete, customActionButton, portalElement, placements = "bottom-end", parentRef } = props;
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { t } = useTranslation();

  const removeFromReleaseLabel = t("releases.scope_page.remove_from_release") ?? "Remove from release";

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await handleDelete();
      setConfirmModalOpen(false);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    } finally {
      setIsRemoving(false);
    }
  };

  const CONTEXT_MENU_ITEMS = [
    {
      key: "remove-from-release",
      title: removeFromReleaseLabel,
      icon: XCircle,
      action: () => setConfirmModalOpen(true),
      // disabled: readOnly, <permissionEngine> release permissions to be added here
      disabled: false,
    },
  ];

  const enabledOptions = CONTEXT_MENU_ITEMS.filter((o) => !o.disabled);
  if (!enabledOptions.length) return null;

  return (
    <>
      <AlertModalCore
        isOpen={confirmModalOpen}
        handleClose={() => setConfirmModalOpen(false)}
        handleSubmit={handleConfirmRemove}
        isSubmitting={isRemoving}
        title={removeFromReleaseLabel}
        content={t("releases.scope_page.confirm_remove.content")}
        primaryButtonText={{
          default: t("releases.scope_page.confirm_remove.primary_button.default"),
          loading: t("releases.scope_page.confirm_remove.primary_button.loading"),
        }}
        variant="danger"
      />
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu
        ellipsis
        customButton={customActionButton}
        portalElement={portalElement}
        placement={placements}
        menuItemsClassName="z-[14]"
        maxHeight="lg"
        useCaptureForOutsideClick
        closeOnSelect
      >
        {CONTEXT_MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={() => !item.disabled && item.action()}
            className={cn("flex items-center gap-2", { "text-placeholder": item.disabled })}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className="h-3 w-3" />}
            <div>
              <h5>{item.title}</h5>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
