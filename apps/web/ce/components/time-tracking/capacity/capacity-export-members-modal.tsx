/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Modal to pick members (or "all members") before queuing a detailed XLSX export.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Users } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type Props = {
  isOpen: boolean;
  isSubmitting: boolean;
  initialSelectedMemberIds: string[];
  projectId?: string;
  onClose: () => void;
  /** memberIds=null → export all members */
  onConfirm: (memberIds: string[] | null) => void;
};

export const CapacityExportMembersModal = observer(function CapacityExportMembersModal(props: Props) {
  const { isOpen, isSubmitting, initialSelectedMemberIds, projectId, onClose, onConfirm } = props;
  const { t } = useTranslation();

  const [allMembers, setAllMembers] = useState<boolean>(initialSelectedMemberIds.length === 0);
  const [selected, setSelected] = useState<string[]>(initialSelectedMemberIds);
  const wasOpenRef = useRef(false);

  // Sync state ONLY on the closed→open transition. Parent re-renders produce a
  // new initialSelectedMemberIds array reference; depending on it would wipe
  // user edits mid-modal (the "uncheck/re-check all members" payload bug).
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setAllMembers(initialSelectedMemberIds.length === 0);
      setSelected(initialSelectedMemberIds);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialSelectedMemberIds]);

  const handleAllMembersToggle = (next: boolean) => {
    setAllMembers(next);
    if (next) setSelected([]);
  };

  const canSubmit = allMembers || selected.length > 0;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(allMembers ? null : selected);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-primary">{t("capacity_export.select_members_title")}</h3>
            <p className="mt-1 text-13 text-secondary">{t("capacity_export.select_members_desc")}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allMembers}
              onChange={(e) => handleAllMembersToggle(e.target.checked)}
              className="h-4 w-4 rounded border-subtle bg-layer-2 accent-accent-primary"
              disabled={isSubmitting}
            />
            <span className="text-13 text-primary">{t("capacity_export.all_members")}</span>
          </label>

          {!allMembers && (
            <div className="space-y-1.5">
              <span className="block text-12 font-medium text-secondary">{t("capacity_export.specific_members")}</span>
              <MemberDropdown
                value={selected}
                onChange={(val: string[]) => setSelected(val)}
                projectId={projectId}
                multiple
                buttonVariant="border-with-text"
                buttonClassName="!w-full !justify-start !py-2 !px-3 bg-layer-2"
                dropdownArrow
                placeholder={t("capacity_export.pick_members")}
                placement="bottom-start"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!canSubmit} loading={isSubmitting}>
            {t("capacity_export.export_button")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
