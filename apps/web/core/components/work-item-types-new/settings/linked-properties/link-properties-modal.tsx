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

import { useCallback, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { LinkPropertiesModalItem } from "./link-properties-modal-item";
import type { LinkedPropertyData } from "./types";

type LinkPropertiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  linkableProperties: LinkedPropertyData[];
  onLink: (propertyIds: string[]) => Promise<void>;
};

export function LinkPropertiesModal(props: LinkPropertiesModalProps) {
  const { isOpen, onClose, linkableProperties, onLink } = props;
  // state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  // hooks
  const { t } = useTranslation();

  // handlers
  const handleToggle = useCallback((propertyId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsSubmitting(true);
      await onLink(Array.from(selectedIds));
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds, onLink, handleClose]);

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">{t("work_item_types.settings.linked_properties.modal.title")}</h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={handleClose} />
      </div>
      {/* Body */}
      <div className="max-h-96 space-y-2 overflow-y-auto px-5 py-4">
        {linkableProperties.length > 0 ? (
          linkableProperties.map((property) => (
            <LinkPropertiesModalItem
              key={property.id}
              property={property}
              isSelected={selectedIds.has(property.id)}
              onToggle={() => handleToggle(property.id)}
            />
          ))
        ) : (
          <div className="py-6">
            <EmptyStateCompact
              title={t("work_item_types.settings.linked_properties.modal.empty.title")}
              description={t("work_item_types.settings.linked_properties.modal.empty.description")}
            />
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={selectedIds.size === 0} loading={isSubmitting}>
          {t("common.add")}
        </Button>
      </div>
    </ModalCore>
  );
}
