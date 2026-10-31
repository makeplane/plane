/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import type { BadgeVariant } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { setToast } from "@plane/blocks/toast";
import { LEAVE_TYPE_LABELS, parseDateKey } from "@plane/services";
import type { TLeaveAction, TLeaveRequest, TLeaveStatus, TLeaveType } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useLeaveRequests } from "@/hooks/team-ops/use-leave-requests";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const STATUS: Record<TLeaveStatus, { label: string; badge: BadgeVariant }> = {
  PENDING: { label: "Pending", badge: "warning" },
  APPROVED: { label: "Approved", badge: "success" },
  REJECTED: { label: "Rejected", badge: "danger" },
  CANCELLED: { label: "Cancelled", badge: "neutral" },
};

const LEAVE_OPTIONS = (Object.keys(LEAVE_TYPE_LABELS) as TLeaveType[]).map((value) => ({
  value,
  label: LEAVE_TYPE_LABELS[value],
}));

const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
const period = (request: TLeaveRequest) =>
  request.start_date === request.end_date
    ? dayFormat.format(parseDateKey(request.start_date))
    : `${dayFormat.format(parseDateKey(request.start_date))} – ${dayFormat.format(parseDateKey(request.end_date))}`;

/** Ask for leave, follow your requests and, for managers, approve or reject the ones waiting. */
export const LeaveRoot = observer(function LeaveRoot({ workspaceSlug }: Props) {
  const { mine, toReview, create, act } = useLeaveRequests(workspaceSlug);
  const { getUserDetails } = useMember();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<TLeaveType>("ANNUAL");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      setToast({ type: "success", title: success, message: "" });
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      await create({ start_date: start, end_date: end || start, leave_type: type, note: note.trim() });
      setStart("");
      setEnd("");
      setNote("");
    }, "Leave requested");

  const decision = (request: TLeaveRequest, action: TLeaveAction) =>
    run(
      () => act(request.id, action),
      action === "cancel" ? "Request cancelled" : action === "approve" ? "Approved" : "Rejected"
    );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
        <h2 className="text-h6-medium text-primary">Ask for leave</h2>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            type="date"
            size="lg"
            orientation="vertical"
            label="From"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <InputField
            type="date"
            size="lg"
            orientation="vertical"
            label="To (optional)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="[&_button]:min-w-0">
          <SelectField
            size="lg"
            label="Type"
            options={LEAVE_OPTIONS}
            value={type}
            onValueChange={(v) => v && setType(v as TLeaveType)}
          />
        </div>
        <TextAreaField
          size="lg"
          resize="none"
          autoResize
          maxRows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for your manager (optional)"
          aria-label="Note"
          maxLength={2000}
        />
        <p className="text-caption-sm-regular text-tertiary">
          Only working days that are not holidays are taken. When a manager approves, they appear as leave in your
          calendar.
        </p>
        <div>
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            label="Send request"
            loading={busy}
            disabled={!start}
            onClick={submit}
          />
        </div>
      </section>

      {toReview.length > 0 ? (
        <section aria-label="To review" className="flex flex-col gap-2">
          <h2 className="text-h6-medium text-primary">Waiting for your decision</h2>
          <ul className="divide-y divide-subtle rounded-lg border border-subtle bg-surface-1">
            {toReview.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-body-sm-medium text-primary">
                    {getUserDetails(request.user)?.display_name ?? "Someone"} · {LEAVE_TYPE_LABELS[request.leave_type]}
                  </p>
                  <p className="text-caption-sm-regular text-tertiary">
                    {period(request)}
                    {request.note ? ` · ${request.note}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    stretch="auto"
                    label="Approve"
                    disabled={busy}
                    onClick={() => decision(request, "approve")}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    stretch="auto"
                    label="Reject"
                    disabled={busy}
                    onClick={() => decision(request, "reject")}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="My requests" className="flex flex-col gap-2">
        <h2 className="text-h6-medium text-primary">My requests</h2>
        {mine.length === 0 ? (
          <p className="text-body-sm-regular text-tertiary">You have not asked for leave yet.</p>
        ) : (
          <ul className="divide-y divide-subtle rounded-lg border border-subtle bg-surface-1">
            {mine.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-body-sm-medium text-primary">
                    {LEAVE_TYPE_LABELS[request.leave_type]} · {period(request)}
                  </p>
                  {request.decision_note ? (
                    <p className="text-caption-sm-regular text-tertiary">{request.decision_note}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS[request.status].badge} size="sm" label={STATUS[request.status].label} />
                  {request.status === "PENDING" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      stretch="auto"
                      label="Cancel"
                      disabled={busy}
                      onClick={() => decision(request, "cancel")}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
});
