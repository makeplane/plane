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
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue, TMeetingPayload } from "@plane/types";
// local imports
import { defaultMeetingTime, isMeetingTimeValid } from "./time";
import { MeetingTimeFields } from "./time-fields";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<TIssue>) => Promise<boolean>;
};

/** Asks for the time a task needs to become a meeting. */
export function ConvertToMeetingDialog(props: Props) {
  const { isOpen, onClose, onSubmit } = props;
  const [meeting, setMeeting] = useState<TMeetingPayload>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) setMeeting(defaultMeetingTime());
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const isDone = await onSubmit({ kind: "meeting", meeting });
    setIsSubmitting(false);
    if (isDone) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("meeting.make_meeting")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <MeetingTimeFields value={meeting} onChange={setMeeting} />
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label={t("cancel")} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            disabled={!isMeetingTimeValid(meeting)}
            onClick={() => void handleSubmit()}
            label={t("save")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
