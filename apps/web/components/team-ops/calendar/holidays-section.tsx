/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { ChevronLeftOutline, ChevronRightOutline, DeleteOutline } from "@makeplane/propel/icons";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { parseDateKey } from "@plane/services";
import type { TCalendarHoliday } from "@plane/types";
// hooks
import { useHolidays } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { getErrorMessage } from "./error-message";

type Props = {
  workspaceSlug: string;
};

const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "long" });

/** Workspace holidays: non-working days for everybody. Admins add and remove them. */
export function HolidaysSection({ workspaceSlug }: Props) {
  // states
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [toRemove, setToRemove] = useState<TCalendarHoliday | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  // hooks
  const { holidays, addHoliday, removeHoliday } = useHolidays(workspaceSlug, year);

  const handleAdd = async () => {
    if (!date || !name.trim()) return;
    setIsAdding(true);
    try {
      await addHoliday({ date, name: name.trim() });
      setDate("");
      setName("");
      setToast({ type: "success", title: "Holiday added", message: "" });
    } catch (error) {
      setToast({ type: "error", title: "Could not add the holiday", message: getErrorMessage(error) });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!toRemove) return;
    setIsRemoving(true);
    try {
      await removeHoliday(toRemove.id);
      setToast({ type: "success", title: "Holiday removed", message: "" });
    } catch (error) {
      setToast({ type: "error", title: "Could not remove the holiday", message: getErrorMessage(error) });
    } finally {
      setIsRemoving(false);
      setToRemove(null);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-h6-medium text-primary">Holidays</h2>
          <p className="text-caption-sm-regular text-tertiary">
            A holiday is a day off for everybody. Someone who works on a holiday plans that day by hand.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Previous year"
            onClick={() => setYear((current) => current - 1)}
          />
          <span className="w-12 text-center text-body-sm-medium text-primary tabular-nums">{year}</span>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Next year"
            onClick={() => setYear((current) => current + 1)}
          />
        </div>
      </div>

      {holidays && holidays.length > 0 ? (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle">
          {holidays.map((holiday) => (
            <li key={holiday.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-body-sm-regular text-primary">
                <span className="mr-3 inline-block w-32 text-tertiary">
                  {dateFormat.format(parseDateKey(holiday.date))}
                </span>
                {holiday.name}
              </span>
              <IconButton
                icon={<Icon icon={DeleteOutline} />}
                variant="ghost"
                size="sm"
                aria-label={`Remove ${holiday.name}`}
                onClick={() => setToRemove(holiday)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm-regular text-tertiary">No holidays in {year}.</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <InputField
          type="date"
          size="lg"
          orientation="vertical"
          label="Date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <div className="min-w-56 grow">
          <InputField
            type="text"
            size="lg"
            orientation="vertical"
            label="Name"
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Add holiday"
          loading={isAdding}
          disabled={!date || !name.trim()}
          onClick={handleAdd}
        />
      </div>

      <ConfirmDialog
        isOpen={!!toRemove}
        handleClose={() => setToRemove(null)}
        handleSubmit={handleRemove}
        isSubmitting={isRemoving}
        title="Remove holiday"
        content={`Remove ${toRemove?.name ?? "this holiday"}? The day goes back to being a working day.`}
      />
    </section>
  );
}
