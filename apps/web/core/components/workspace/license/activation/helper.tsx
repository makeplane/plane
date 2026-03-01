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

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { CopyIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// plane imports
import { copyTextToClipboard } from "@plane/utils";
// store hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  label: string;
  value: string;
  description?: string | React.ReactNode;
};

function CopyField(props: Props) {
  const { label, value, description } = props;

  const handleCopy = () => {
    copyTextToClipboard(value);
    setToast({
      type: TOAST_TYPE.INFO,
      title: "Copied to clipboard",
      message: `The ${label} has been successfully copied to your clipboard`,
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-11 font-medium text-tertiary">{label}</h4>
      <div className="relative">
        <div
          className="group flex items-center justify-between py-1 px-2 border border-subtle-1 rounded-md cursor-pointer hover:bg-layer-1"
          onClick={handleCopy}
        >
          <p className="text-11 font-medium text-secondary truncate pr-2">{value}</p>
          <Button variant="ghost" className="flex-shrink-0 p-1 h-auto">
            <CopyIcon className="size-4 text-secondary group-hover:text-primary" />
          </Button>
        </div>
      </div>
      {description && <div className="text-11 text-tertiary">{description}</div>}
    </div>
  );
}

type TInstanceDetailsForLicenseActivationProps = {
  workspaceSlug: string;
};

export const InstanceDetailsForLicenseActivation = observer(function InstanceDetailsForLicenseActivation(
  props: TInstanceDetailsForLicenseActivationProps
) {
  const { workspaceSlug } = props;
  // store hooks
  const { instance } = useInstance();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const instanceId = instance?.id;
  const workspace = getWorkspaceBySlug(workspaceSlug);
  const workspaceId = workspace?.id;
  const domain = window.location.origin;
  const appVersion = instance?.current_version;

  const PLANE_PROVIDED_DETAILS = useMemo(
    () => ({
      title: "Plane provided details",
      description:
        "These details are auto-generated for your instance and workspace. You can copy and use them as needed.",
      fields: [
        {
          row: 1,
          fields: [
            {
              label: "Instance ID",
              value: instanceId,
            },
            {
              label: "Workspace ID",
              value: workspaceId,
            },
          ],
        },
        {
          row: 2,
          fields: [
            {
              label: "Workspace slug",
              value: workspaceSlug,
            },
            {
              label: "Domain",
              value: domain,
            },
          ],
        },
        {
          row: 3,
          fields: [
            {
              label: "Instance app version",
              value: appVersion,
            },
            null,
          ],
        },
      ],
    }),
    [instanceId, workspaceId, workspaceSlug, domain, appVersion]
  );

  return (
    <div className="py-4">
      <div className="mb-4">
        <h3 className="text-13 font-semibold text-primary">{PLANE_PROVIDED_DETAILS.title}</h3>
        <p className="text-11 text-tertiary">{PLANE_PROVIDED_DETAILS.description}</p>
      </div>
      <div className="flex flex-col gap-y-3 gap-x-6">
        {PLANE_PROVIDED_DETAILS.fields.map((row) => (
          <div key={row.row} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {row.fields.map((field, index) => (
              <div key={index} className="flex-1">
                {field && field.value && <CopyField label={field.label} value={field.value} description={undefined} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
