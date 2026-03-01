/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "./state-group-icon";
import { IntakeStateGroupIcon } from "./intake-state-group-icon";
import { BacklogGroupIcon } from "./backlog-group-icon";
import { CancelledGroupIcon } from "./cancelled-group-icon";
import { CompletedGroupIcon } from "./completed-group-icon";
import { StartedGroupIcon } from "./started-group-icon";
import { UnstartedGroupIcon } from "./unstarted-group-icon";
import { TriageGroupIcon } from "./triage-group-icon";

const meta = preview.meta({
  component: StateGroupIcon,
  parameters: {
    layout: "centered",
  },
});

export const AllStates = meta.story({
  args: { stateGroup: "backlog" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <StateGroupIcon stateGroup="backlog" />
        <StateGroupIcon stateGroup="unstarted" />
        <StateGroupIcon stateGroup="started" />
        <StateGroupIcon stateGroup="completed" />
        <StateGroupIcon stateGroup="cancelled" />
      </div>
    );
  },
});

export const AllSizes = meta.story({
  args: { stateGroup: "started" },
  render(_args) {
    return (
      <div className="flex items-end gap-4">
        <StateGroupIcon stateGroup="started" size={EIconSize.XS} />
        <StateGroupIcon stateGroup="started" size={EIconSize.SM} />
        <StateGroupIcon stateGroup="started" size={EIconSize.MD} />
        <StateGroupIcon stateGroup="started" size={EIconSize.LG} />
        <StateGroupIcon stateGroup="started" size={EIconSize.XL} />
      </div>
    );
  },
});

export const StartedWithPercentages = meta.story({
  args: { stateGroup: "started" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <StartedGroupIcon percentage={0} />
        <StartedGroupIcon percentage={0.25} />
        <StartedGroupIcon percentage={0.5} />
        <StartedGroupIcon percentage={25} />
        <StartedGroupIcon percentage={50} />
        <StartedGroupIcon percentage={75} />
        <StartedGroupIcon percentage={100} />
      </div>
    );
  },
});

export const CustomColors = meta.story({
  args: { stateGroup: "backlog" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <StateGroupIcon stateGroup="backlog" color="#FF0000" />
        <StateGroupIcon stateGroup="unstarted" color="#00FF00" />
        <StateGroupIcon stateGroup="started" color="#0000FF" />
        <StateGroupIcon stateGroup="completed" color="#FF00FF" />
        <StateGroupIcon stateGroup="cancelled" color="#00FFFF" />
      </div>
    );
  },
});

export const WithClassName = meta.story({
  args: { stateGroup: "completed", className: "opacity-50" },
});

export const Backlog = meta.story({
  args: { stateGroup: "backlog" },
  render(_args) {
    return <BacklogGroupIcon />;
  },
});

export const Unstarted = meta.story({
  args: { stateGroup: "unstarted" },
  render(_args) {
    return <UnstartedGroupIcon />;
  },
});

export const Started = meta.story({
  args: { stateGroup: "started" },
  render(_args) {
    return <StartedGroupIcon percentage={60} />;
  },
});

export const Completed = meta.story({
  args: { stateGroup: "completed" },
  render(_args) {
    return <CompletedGroupIcon />;
  },
});

export const Cancelled = meta.story({
  args: { stateGroup: "cancelled" },
  render(_args) {
    return <CancelledGroupIcon />;
  },
});

export const Triage = meta.story({
  args: { stateGroup: "backlog" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <IntakeStateGroupIcon stateGroup="triage" />
        <IntakeStateGroupIcon stateGroup="triage" size={EIconSize.LG} />
        <IntakeStateGroupIcon stateGroup="triage" color="#FF5733" />
        <IntakeStateGroupIcon stateGroup="triage" className="opacity-50" />
        <TriageGroupIcon />
      </div>
    );
  },
});
