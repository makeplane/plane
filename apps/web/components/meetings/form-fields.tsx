/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { InputField } from "@makeplane/propel/components/input-field";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TMeetingPayload } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// local imports
import { MeetingTimeFields } from "./time-fields";

type Props = {
  projectId: string | null;
  value: TMeetingPayload;
  onChange: (value: TMeetingPayload) => void;
};

/** Time, people and place of a new meeting. */
export const MeetingFormFields = observer(function MeetingFormFields(props: Props) {
  const { projectId, value, onChange } = props;
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <MeetingTimeFields value={value} onChange={(time) => onChange({ ...value, ...time })} />
      <MemberSelect
        multiple
        projectId={projectId ?? undefined}
        value={value.participant_ids ?? []}
        onChange={(participant_ids) => onChange({ ...value, participant_ids })}
        placeholder={t("meeting.participants")}
        variant={value.participant_ids?.length ? "avatar-group-md" : "pill-md"}
      />
      <MemberSelect
        projectId={projectId ?? undefined}
        value={value.organizer_id}
        onChange={(organizer_id) => onChange({ ...value, organizer_id })}
        placeholder={t("meeting.organizer")}
        variant="pill-md"
      />
      <div className="w-full">
        <InputField
          size="lg"
          orientation="vertical"
          type="text"
          name="meeting_location"
          aria-label={t("meeting.location")}
          placeholder={t("meeting.location")}
          maxLength={1000}
          value={value.location ?? ""}
          onChange={(event) => onChange({ ...value, location: event.target.value })}
        />
      </div>
    </div>
  );
});
