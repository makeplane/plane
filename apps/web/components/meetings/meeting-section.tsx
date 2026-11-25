/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { MembersOutline, UserOutline } from "@makeplane/propel/icons";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TMeetingPayload } from "@plane/types";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { getProductErrorKey } from "@/components/products/helper";
import { useProductUpdate } from "@/components/products/use-product";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { MeetingService } from "@/services/meeting.service";
// local imports
import { MeetingTaskDialog } from "./create-task-dialog";
import { isMeetingTimeValid } from "./time";
import { MeetingTimeFields } from "./time-fields";
import { useMeeting } from "./use-meeting";

const meetingService = new MeetingService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

/** Time, people and place in the sidebar of a meeting. */
export const MeetingSection = observer(function MeetingSection(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // states
  const [time, setTime] = useState<Pick<TMeetingPayload, "start_at" | "end_at">>({});
  const [location, setLocation] = useState("");
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // hooks
  const { t } = useTranslation();
  const { fetchActivities, fetchRelations } = useIssueDetail();
  const { meeting, reload } = useMeeting(workspaceSlug, projectId, issueId);
  const update = useProductUpdate(workspaceSlug, projectId, issueId);
  // derived values
  const { start_at, end_at } = meeting ?? {};
  const savedLocation = meeting?.location ?? "";

  useEffect(() => setTime({ start_at, end_at }), [start_at, end_at]);
  useEffect(() => setLocation(savedLocation), [savedLocation]);

  if (!meeting) return null;

  const save = async (payload: TMeetingPayload) => {
    const isSaved = await update({ meeting: payload });
    if (isSaved) await reload();
    return isSaved;
  };

  const isTimeChanged = time.start_at !== start_at || time.end_at !== end_at;

  // one save for both ends, so that participants hear about the change once
  const saveTime = async () => {
    setIsSaving(true);
    if (!(await save(time))) setTime({ start_at, end_at });
    setIsSaving(false);
  };

  const saveLocation = async () => {
    if (location.trim() === savedLocation) return;
    if (!(await save({ location: location.trim() }))) setLocation(savedLocation);
  };

  const createTask = async (name: string) => {
    try {
      await meetingService.createTask(workspaceSlug, projectId, issueId, name);
    } catch (error) {
      setToast({ type: "error", title: t("toast.error"), message: t(getProductErrorKey(error)) });
      return false;
    }
    setToast({ type: "success", title: t("success"), message: t("meeting.task_created") });
    await fetchRelations(workspaceSlug, projectId, issueId);
    await fetchActivities(workspaceSlug, projectId, issueId);
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <MeetingTaskDialog isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} onSubmit={createTask} />
      <MeetingTimeFields value={time} onChange={setTime} disabled={disabled} />
      {isTimeChanged && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            loading={isSaving}
            disabled={!isMeetingTimeValid(time)}
            label={t("meeting.reschedule")}
            onClick={() => void saveTime()}
          />
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label={t("cancel")}
            onClick={() => setTime({ start_at, end_at })}
          />
        </div>
      )}
      <SidebarPropertyListItem icon={UserOutline} label={t("meeting.organizer")}>
        <MemberSelect
          projectId={projectId}
          value={meeting.organizer_id}
          onChange={(organizer_id) => void save({ organizer_id })}
          placeholder={t("meeting.organizer")}
          disabled={disabled}
          variant="select-md"
        />
      </SidebarPropertyListItem>
      <SidebarPropertyListItem icon={MembersOutline} label={t("meeting.participants")}>
        <MemberSelect
          multiple
          projectId={projectId}
          value={meeting.participant_ids ?? []}
          onChange={(participant_ids) => void save({ participant_ids })}
          placeholder={t("meeting.participants")}
          disabled={disabled}
          variant="select-md"
        />
      </SidebarPropertyListItem>
      <InputField
        size="lg"
        orientation="vertical"
        label={t("meeting.location")}
        type="text"
        name="meeting_location"
        maxLength={1000}
        value={location}
        disabled={disabled}
        onChange={(event) => setLocation(event.target.value)}
        onBlur={() => void saveLocation()}
      />
      {/^https?:\/\//i.test(savedLocation) && (
        <a
          href={savedLocation}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-caption-md-regular text-accent-primary hover:underline"
        >
          {savedLocation}
        </a>
      )}
      {!disabled && (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={t("meeting.create_task")}
          onClick={() => setIsTaskOpen(true)}
        />
      )}
    </div>
  );
});
