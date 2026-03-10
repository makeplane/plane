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
import { InitiativeStateIcon } from "./initiative-states-icon";
import { ClosedIcon } from "./closed-icon";

const meta = preview.meta({
  title: "Media/Icons/Initiative States",
  component: InitiativeStateIcon,
  parameters: {
    layout: "centered",
  },
});

export const AllStates = meta.story({
  args: { state: "DRAFT" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <InitiativeStateIcon state="DRAFT" />
        <InitiativeStateIcon state="PLANNED" />
        <InitiativeStateIcon state="ACTIVE" percentage={50} />
        <InitiativeStateIcon state="COMPLETED" />
        <InitiativeStateIcon state="CLOSED" />
      </div>
    );
  },
});

export const AllSizes = meta.story({
  args: { state: "ACTIVE" },
  render(_args) {
    return (
      <div className="flex items-end gap-4">
        <InitiativeStateIcon state="ACTIVE" size={EIconSize.XS} />
        <InitiativeStateIcon state="ACTIVE" size={EIconSize.SM} />
        <InitiativeStateIcon state="ACTIVE" size={EIconSize.MD} />
        <InitiativeStateIcon state="ACTIVE" size={EIconSize.LG} />
        <InitiativeStateIcon state="ACTIVE" size={EIconSize.XL} />
      </div>
    );
  },
});

export const CustomColors = meta.story({
  args: { state: "DRAFT" },
  render(_args) {
    return (
      <div className="flex items-center gap-4">
        <InitiativeStateIcon state="DRAFT" color="#FF0000" />
        <InitiativeStateIcon state="PLANNED" color="#00FF00" />
        <InitiativeStateIcon state="ACTIVE" color="#0000FF" />
        <InitiativeStateIcon state="COMPLETED" color="#FF00FF" />
        <InitiativeStateIcon state="CLOSED" color="#00FFFF" />
      </div>
    );
  },
});

export const ClosedIconDirect = meta.story({
  args: { state: "CLOSED" },
  render(_args) {
    return <ClosedIcon className="size-6" />;
  },
});
