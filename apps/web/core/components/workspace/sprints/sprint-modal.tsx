/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

type Props = {
  automationId: string;
  isOpen: boolean;
  onClose: () => void;
};

const toDateTimeLocalValue = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const SprintCreateModal = observer(function SprintCreateModal(props: Props) {
  const { automationId, isOpen, onClose } = props;
  const { workspaceSlug } = useParams();
  const { createWorkspaceSprint } = useWorkspaceSprint();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(toDateTimeLocalValue(new Date()));
  const [endDate, setEndDate] = useState(toDateTimeLocalValue(new Date(Date.now() + 13 * 24 * 60 * 60 * 1000)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceSlug || !name.trim()) return;

    try {
      setIsSubmitting(true);
      await createWorkspaceSprint(workspaceSlug.toString(), {
        automation_id: automationId,
        name: name.trim(),
        description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        logo_props: {},
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Sprint created",
        message: "The sprint is ready to use.",
      });
      onClose();
      setName("");
      setDescription("");
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not create sprint",
        message: "Please check the dates and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XL}>
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-primary">Add sprint</h3>
        <div className="space-y-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Sprint name" required />
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="min-h-20 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="workspace-sprint-manual-start-date" className="space-y-1 text-12 text-secondary">
              <span>Start date</span>
              <Input
                id="workspace-sprint-manual-start-date"
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>
            <label htmlFor="workspace-sprint-manual-end-date" className="space-y-1 text-12 text-secondary">
              <span>End date</span>
              <Input
                id="workspace-sprint-manual-end-date"
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting || !name.trim()}>
            Add sprint
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
