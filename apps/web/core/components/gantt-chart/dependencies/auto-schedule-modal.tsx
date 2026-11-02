/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { TScheduleLabels } from "./schedule-api";
import type { TScheduleUpdate, TScheduleWarning } from "./scheduling";

type Props = {
  updates: TScheduleUpdate[];
  warnings: TScheduleWarning[];
  labels?: TScheduleLabels;
  issueDates: Record<string, { name: string; sequence_id: number }>;
  projectIdentifier?: string;
  onSave: (includeSuccessors: boolean) => Promise<void | boolean>;
  onClose: () => void;
};

const formatDate = (date: string | null) => (date ? `${date.slice(8, 10)}/${date.slice(5, 7)}` : "—");

export function AutoScheduleModal(props: Props) {
  const { updates, warnings, labels, issueDates, projectIdentifier, onSave, onClose } = props;
  const movesEarlier = updates.some(
    ({ oldStart, oldEnd, newStart, newEnd }) =>
      (oldStart && newStart && newStart < oldStart) || (oldEnd && newEnd && newEnd < oldEnd)
  );
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const code = (id: string) => {
    if (labels?.[id]) return `${labels[id].project_identifier}-${labels[id].sequence_id}`;
    const sequenceId = issueDates[id]?.sequence_id ?? id;
    return projectIdentifier ? `${projectIdentifier}-${sequenceId}` : String(sequenceId);
  };
  const save = async (includeSuccessors: boolean) => {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    try {
      if ((await onSave(includeSuccessors)) !== false) onClose();
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={() => void save(false)} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title as="h3" className="text-18 font-medium">
            {updates.length === 0
              ? "Không dời được việc sau"
              : movesEarlier
                ? "Cập nhật lịch các việc sau"
                : "Tự lùi lịch các việc sau"}
          </Dialog.Title>
          <button
            type="button"
            aria-label="Đóng"
            disabled={isSaving}
            className="rounded p-1 text-tertiary hover:bg-layer-transparent-hover"
            onClick={() => void save(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {updates.length > 0 && (
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full text-left text-13">
              <thead className="text-tertiary">
                <tr>
                  <th className="p-2">Công việc</th>
                  <th className="p-2">Bắt đầu</th>
                  <th className="p-2">Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((update) => (
                  <tr key={update.id} className="border-t border-subtle">
                    <td className="p-2">
                      <span className="text-tertiary">{code(update.id)}</span>{" "}
                      {labels?.[update.id]?.name ?? issueDates[update.id]?.name}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {formatDate(update.oldStart)} → {formatDate(update.newStart)}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {formatDate(update.oldEnd)} → {formatDate(update.newEnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {warnings.length > 0 && (
          <ul className="mt-3 text-11 text-tertiary">
            {warnings.map(({ id, reason }) => (
              <li key={`${id}-${reason}`}>
                {code(id)}
                {labels?.[id] ? ` ${labels[id].name}` : ""}:{" "}
                {reason === "no_permission"
                  ? "Không có quyền ở project của việc này — giữ nguyên"
                  : reason === "missing_dates"
                    ? "chưa có ngày, không tự lùi"
                    : "việc trước chưa có ngày kết thúc"}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={isSaving} onClick={() => void save(false)}>
            {updates.length === 0 ? "Lưu việc này" : "Chỉ đổi việc này"}
          </Button>
          {updates.length > 0 && (
            <Button variant="primary" disabled={isSaving} loading={isSaving} onClick={() => void save(true)}>
              {movesEarlier ? "Cập nhật" : "Lùi"} {updates.length} việc sau
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
}
