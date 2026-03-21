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

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { useTranslation } from "@plane/i18n";
// components
import { TypedConfirmationModal } from "@/components/common/modal/typed-confirmation-modal";
// local imports
import { LinkedPropertyList } from "./linked-property-list";
import { LinkPropertiesModal } from "./link-properties-modal";
import type { LinkedPropertyData, LinkedPropertyActions, LinkedPropertyPermissions } from "./types";

type LinkedPropertiesRootProps = {
  id: string;
  linkedProperties: LinkedPropertyData[];
  availableProperties: LinkedPropertyData[];
  actions: LinkedPropertyActions;
  permissions: LinkedPropertyPermissions;
};

const CONFIRMATION_TEXT = "permanently delete values";

export const LinkedPropertiesRoot = observer(function LinkedPropertiesRoot(props: LinkedPropertiesRootProps) {
  const { id, linkedProperties, availableProperties, actions, permissions } = props;
  // state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlinkPropertyId, setUnlinkPropertyId] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  // hooks
  const { t } = useTranslation();

  // Compute properties that can still be linked (available minus already linked)
  const linkableProperties = useMemo(() => {
    const linkedIds = new Set(linkedProperties.map((p) => p.id));
    return availableProperties.filter((p) => !linkedIds.has(p.id));
  }, [linkedProperties, availableProperties]);

  // Sort linked properties by sort_order for display
  const sortedLinkedProperties = useMemo(
    () => [...linkedProperties].sort((a, b) => a.sort_order - b.sort_order),
    [linkedProperties]
  );

  const handleUnlinkClose = useCallback(() => {
    setUnlinkPropertyId(null);
  }, []);

  const handleUnlinkConfirm = useCallback(async () => {
    if (!unlinkPropertyId) return;
    setIsUnlinking(true);
    try {
      await actions.unlink(unlinkPropertyId);
    } finally {
      setIsUnlinking(false);
      handleUnlinkClose();
    }
  }, [unlinkPropertyId, actions, handleUnlinkClose]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h6 className="text-body-xs-medium text-secondary">{t("work_item_types.settings.linked_properties.title")}</h6>
        {linkedProperties.length > 0 && (
          <span className="rounded-full bg-layer-3 px-1.5 py-0.5 text-caption-sm-medium text-tertiary">
            {linkedProperties.length}
          </span>
        )}
      </div>
      {/* Linked properties list */}
      <LinkedPropertyList
        id={id}
        linkedProperties={sortedLinkedProperties}
        actions={{
          ...actions,
          unlink: async (propertyId: string) => {
            setUnlinkPropertyId(propertyId);
          },
        }}
        permissions={permissions}
      />
      {/* Add button */}
      {permissions.canLink && (
        <div>
          <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} />
            <span>{t("work_item_types.settings.linked_properties.add_button")}</span>
          </Button>
        </div>
      )}
      {/* Link properties modal */}
      <LinkPropertiesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        linkableProperties={linkableProperties}
        onLink={(propertyIds) => actions.link(propertyIds)}
      />
      {/* Unlink confirmation modal */}
      <TypedConfirmationModal
        isOpen={!!unlinkPropertyId}
        onClose={handleUnlinkClose}
        onSubmit={handleUnlinkConfirm}
        isSubmitting={isUnlinking}
        title={t("work_item_types.settings.linked_properties.unlink_confirmation.title")}
        description={t("work_item_types.settings.linked_properties.unlink_confirmation.description")}
        confirmationText={CONFIRMATION_TEXT}
        inputLabel={
          <>
            {t("work_item_types.settings.linked_properties.unlink_confirmation.input_label")}{" "}
            <span className="font-medium text-primary">{CONFIRMATION_TEXT}</span>{" "}
            {t("work_item_types.settings.linked_properties.unlink_confirmation.input_label_suffix")}
          </>
        }
        primaryButtonText={{
          default: t("work_item_types.settings.linked_properties.unlink_confirmation.confirm"),
          loading: t("work_item_types.settings.linked_properties.unlink_confirmation.loading"),
        }}
      />
    </div>
  );
});
