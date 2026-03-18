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
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { ImportTypesList } from "./import-types-list";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  importableTypes: BaseWorkItemTypeInstanceSchema[];
  onImport: (typeIds: string[]) => Promise<void>;
};

export const ImportWorkItemTypesModal = observer(function ImportWorkItemTypesModal(props: Props) {
  const { isOpen, onClose, importableTypes, onImport } = props;
  // state
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  // plane hooks
  const { t } = useTranslation();

  // handlers
  const handleToggle = useCallback((typeId: string) => {
    setSelectedTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelectedTypeIds(new Set());
    onClose();
  }, [onClose]);

  const handleAdd = useCallback(async () => {
    if (selectedTypeIds.size === 0) return;
    setIsImporting(true);
    try {
      await onImport(Array.from(selectedTypeIds));
      handleClose();
    } finally {
      setIsImporting(false);
    }
  }, [selectedTypeIds, onImport, handleClose]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XL}>
      <div className="p-4 w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <h5 className="text-h6-medium">Select work item types from workspace library</h5>
          <IconButton icon={CloseIcon} variant={"ghost"} onClick={handleClose} />
        </div>
        {/* Divider */}
        <div className="border-t border-subtle" />
        {/* Work item types list */}
        <ImportTypesList workItemTypes={importableTypes} selectedTypeIds={selectedTypeIds} onToggle={handleToggle} />
        {/* Footer */}
        <div className="flex gap-3 justify-end">
          <Button size="lg" variant={"ghost"} onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            size="lg"
            onClick={handleAdd}
            disabled={selectedTypeIds.size === 0 || isImporting}
            loading={isImporting}
          >
            {t("common.add")}
            {selectedTypeIds.size > 0 && ` (${selectedTypeIds.size})`}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
