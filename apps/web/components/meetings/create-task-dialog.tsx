/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
// plane imports
import { useTranslation } from "@plane/i18n";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Resolves to whether the dialog may close. */
  onSubmit: (name: string) => Promise<boolean>;
};

export function MeetingTaskDialog(props: Props) {
  const { isOpen, onClose, onSubmit } = props;
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isDone = await onSubmit(name.trim());
    setIsSubmitting(false);
    if (isDone) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("meeting.create_task")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <InputField
              size="lg"
              orientation="vertical"
              label={t("name")}
              hint={t("meeting.create_task_hint")}
              required
              type="text"
              name="task_name"
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            disabled={!name.trim()}
            onClick={() => void handleSubmit()}
            label={t("meeting.create_task")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
