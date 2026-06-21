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
import { EmojiIconPickerTypes, EmojiPicker, Logo } from "@plane/propel/emoji-icon-picker";
import { CycleIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TLogoProps } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (automationId: string) => void;
};

const toDateTimeLocalValue = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatLogoProps = (value: any): TLogoProps => {
  let logoValue = {};

  if (value?.type === "emoji") logoValue = { value: value.value };
  else if (value?.type === "icon") logoValue = value.value;

  return {
    in_use: value?.type,
    [value?.type]: logoValue,
  } as TLogoProps;
};

export const SprintAutomationModal = observer(function SprintAutomationModal(props: Props) {
  const { isOpen, onClose, onCreated } = props;
  const { workspaceSlug } = useParams();
  const { createWorkspaceSprintAutomation } = useWorkspaceSprint();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(toDateTimeLocalValue(new Date()));
  const [duration, setDuration] = useState(14);
  const [nameTemplate, setNameTemplate] = useState("Sprint {{number}}");
  const [logoProps, setLogoProps] = useState<TLogoProps | undefined>(undefined);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceSlug || !name.trim()) return;

    try {
      setIsSubmitting(true);
      const automation = await createWorkspaceSprintAutomation(workspaceSlug.toString(), {
        name: name.trim(),
        description,
        enabled: true,
        start_date: new Date(startDate).toISOString(),
        sprint_duration_days: duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name_template: nameTemplate,
        auto_create_next: true,
        logo_props: logoProps,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Squad created",
        message: "The squad and its active sprints are ready.",
      });
      onCreated?.(automation.id);
      onClose();
      setName("");
      setDescription("");
      setNameTemplate("Sprint {{number}}");
      setStartDate(toDateTimeLocalValue(new Date()));
      setDuration(14);
      setLogoProps(undefined);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not create squad",
        message: "Please check the squad configuration and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XL}>
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div>
          <h3 className="text-18 font-medium text-primary">Create squad</h3>
          <p className="mt-1 text-13 text-tertiary">Configure the squad, sprint duration, and automatic naming.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <EmojiPicker
              iconType="material"
              closeOnSelect={false}
              isOpen={isLogoPickerOpen}
              handleToggle={(value: boolean) => setIsLogoPickerOpen(value)}
              className="flex items-center justify-center"
              buttonClassName="flex size-9 flex-shrink-0 items-center justify-center rounded-md bg-surface-2"
              label={
                logoProps?.in_use ? (
                  <Logo logo={logoProps} size={18} type="material" />
                ) : (
                  <CycleIcon className="size-4" />
                )
              }
              onChange={(value: any) => {
                setLogoProps(formatLogoProps(value));
                setIsLogoPickerOpen(false);
              }}
              defaultIconColor={logoProps?.in_use === "icon" ? logoProps?.icon?.color : undefined}
              defaultOpen={logoProps?.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON}
            />
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Squad name"
              className="w-full text-14"
              required
            />
          </div>
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="min-h-20 w-full resize-none text-14"
          />
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="workspace-sprint-start-date" className="space-y-1 text-12 text-secondary">
              <span>Start date</span>
              <Input
                id="workspace-sprint-start-date"
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full text-14"
                required
              />
            </label>
            <label htmlFor="workspace-sprint-duration" className="space-y-1 text-12 text-secondary">
              <span>Duration in days</span>
              <Input
                id="workspace-sprint-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(event) => setDuration(Math.max(1, Number(event.target.value)))}
                className="w-full text-14"
                required
              />
            </label>
          </div>
          <label htmlFor="workspace-sprint-name-template" className="space-y-1 text-12 text-secondary">
            <span>Name template</span>
            <Input
              id="workspace-sprint-name-template"
              value={nameTemplate}
              onChange={(event) => setNameTemplate(event.target.value)}
              placeholder="Sprint {{number}}"
              className="w-full text-14"
              required
            />
            <span className="text-11 text-tertiary">
              Use {"{{number}}"}, {"{{start}}"}, or {"{{end}}"}.
            </span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting || !name.trim()}>
            Create squad
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
