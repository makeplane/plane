/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IAutoJoinResult, TAutoJoinMode } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

type Props = {
  deptId: string | null;
  deptName: string;
  onClose: () => void;
};

export const AutoJoinModal = function AutoJoinModal({ deptId, deptName, onClose }: Props) {
  const { autoJoin } = useInstanceDepartment();
  const [mode, setMode] = useState<TAutoJoinMode>("all_projects");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IAutoJoinResult | null>(null);

  if (!deptId) return null;

  const handleClose = () => {
    setResult(null);
    setMode("all_projects");
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await autoJoin(deptId, mode);
      setResult(res);
    } catch (err) {
      const message = (err as Record<string, string>)?.error ?? "Auto join failed";
      setToast({ type: TOAST_TYPE.ERROR, title: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-layer-1 rounded-xl border border-subtle shadow-xl w-[420px] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-accent-primary" />
          <h2 className="text-16 font-semibold">Auto Join — {deptName}</h2>
        </div>

        {result ? (
          <div className="space-y-3">
            <p className="text-14 text-secondary">Manager joined to projects:</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold text-success">{result.newly_added}</div>
                <div className="text-11 text-tertiary mt-1">Newly added</div>
              </div>
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold text-tertiary">{result.already_member}</div>
                <div className="text-11 text-tertiary mt-1">Already member</div>
              </div>
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold">{result.total}</div>
                <div className="text-11 text-tertiary mt-1">Total</div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-13 text-secondary">
              Join the department manager as <strong>Admin</strong> to:
            </p>
            <div className="space-y-2">
              {[
                {
                  value: "all_projects" as TAutoJoinMode,
                  label: "All Projects",
                  desc: "Every project in the linked workspace",
                },
                {
                  value: "bank_wide_projects" as TAutoJoinMode,
                  label: "Bank-wide Projects",
                  desc: "Only projects marked as bank-wide",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`auto-join-mode-${opt.value}`}
                  aria-label={opt.label}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    mode === opt.value
                      ? "border-accent-primary bg-accent-subtle"
                      : "border-subtle hover:border-secondary"
                  }`}
                >
                  <input
                    id={`auto-join-mode-${opt.value}`}
                    type="radio"
                    name="auto-join-mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-13 font-medium">{opt.label}</div>
                    <div className="text-12 text-tertiary">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleConfirm()} loading={loading}>
                <UserPlus className="w-3.5 h-3.5" />
                Auto Join
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
