/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { WorkspaceService, TLarkContact } from "@plane/services";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

const workspaceService = new WorkspaceService();

const ROLE_OPTIONS = [
  { value: 5, labelKey: "common.roles.guest", labelFallback: "Guest" },
  { value: 15, labelKey: "common.roles.member", labelFallback: "Member" },
  { value: 20, labelKey: "common.roles.admin", labelFallback: "Admin" },
];

type LarkInviteModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  onClose: () => void;
  onInvited?: () => void;
};

export const LarkInviteModal = function LarkInviteModal({
  isOpen,
  workspaceSlug,
  onClose,
  onInvited,
}: LarkInviteModalProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState<TLarkContact[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<number>(15);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setSearch("");
    setLoadError(null);
    setLoading(true);
    workspaceService
      .listLarkContacts(workspaceSlug)
      .then((res) => {
        setContacts(res.contacts || []);
      })
      .catch((err) => {
        const message = (err && (err.error || err.message)) || "Failed to load Lark contacts";
        setLoadError(message);
        setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message });
      })
      .finally(() => setLoading(false));
  }, [isOpen, workspaceSlug]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const haystack = [c.name, c.en_name, c.email, c.enterprise_email].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [contacts, search]);

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((c) => c.union_id || c.open_id).filter(Boolean)));
  };

  const clearAll = () => setSelected(new Set());

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const users = contacts
        .filter((c) => selected.has(c.union_id || c.open_id))
        .map((c) => ({
          union_id: c.union_id,
          open_id: c.open_id,
          name: c.name,
          email: c.email,
          enterprise_email: c.enterprise_email,
          avatar_url: c.avatar_url,
          role,
        }));

      const result = await workspaceService.larkInvite(workspaceSlug, { users, role });
      const ok = result.invited?.length || 0;
      const errCount = result.errors?.length || 0;
      setToast({
        type: errCount ? TOAST_TYPE.WARNING : TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: errCount
          ? `Invited ${ok}, ${errCount} failed — check server logs.`
          : `Invited ${ok} member${ok === 1 ? "" : "s"}.`,
      });
      onInvited?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err && typeof err === "object" && "error" in err && (err as { error?: string }).error) ||
        "Failed to invite from Lark";
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL} handleClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-h3-medium">Invite from Lark / 飞书</h3>
          <p className="mt-1 text-sm text-secondary">
            Pick teammates from your Feishu directory. They&apos;ll be added directly and can sign in with Lark SSO.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-placeholder" />
          <input
            type="text"
            className="w-full border-none bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
            placeholder={`${t("search") || "Search"} ${contacts.length} contact${contacts.length === 1 ? "" : "s"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between text-xs text-secondary">
          <span>
            {selected.size} / {filtered.length} selected
            {filtered.length !== contacts.length ? ` (${contacts.length} total)` : ""}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hover:underline disabled:opacity-50"
              onClick={selectAll}
              disabled={loading || filtered.length === 0}
            >
              Select all visible
            </button>
            <button
              type="button"
              className="hover:underline disabled:opacity-50"
              onClick={clearAll}
              disabled={loading || selected.size === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-[400px] min-h-[200px] overflow-y-auto rounded-md border border-subtle">
          {loading ? (
            <div className="p-8 text-center text-sm text-secondary">Loading Lark directory…</div>
          ) : loadError ? (
            <div className="p-8 text-center text-sm text-red-500">{loadError}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-secondary">
              {contacts.length === 0
                ? "No contacts visible. Check the app's Range of Access in the Feishu developer console."
                : "No matches for that search."}
            </div>
          ) : (
            <ul>
              {filtered.map((c) => {
                const key = c.union_id || c.open_id;
                const isSelected = selected.has(key);
                const displayEmail =
                  c.enterprise_email || c.email || "(no email — synthetic identifier will be used)";
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center gap-3 border-b border-subtle px-3 py-2 last:border-b-0 hover:bg-surface-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(key)}
                        className="h-4 w-4"
                      />
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatar_url} alt={c.name} className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs">
                          {c.name?.[0] || "?"}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col">
                        <span className="text-body-sm-medium">{c.name || c.en_name || "(no name)"}</span>
                        <span className="text-xs text-secondary">{displayEmail}</span>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span>Role</span>
            <select
              className="rounded-md border border-subtle bg-surface-1 px-2 py-1 text-sm"
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.labelKey) || r.labelFallback}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="md" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={selected.size === 0 || submitting || loading}
            >
              {submitting ? "Inviting…" : `Invite ${selected.size || ""} ${selected.size === 1 ? "member" : "members"}`}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
};
