"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { Copy } from "lucide-react";
// plane imports
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// store hooks
import { useInstance, useWorkspace } from "@/hooks/store";

type Props = {
  label: string;
  value: string;
  description?: string | JSX.Element;
};

const CopyField: React.FC<Props> = (props) => {
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
      <h4 className="text-xs font-medium text-custom-text-300">{label}</h4>
      <div className="relative">
        <div
          className="group flex items-center justify-between py-1 px-2 border border-custom-border-200 rounded-md cursor-pointer hover:bg-custom-background-90"
          onClick={handleCopy}
        >
          <p className="text-xs font-medium text-custom-text-200 truncate pr-2">{value}</p>
          <Button variant="link-neutral" size="sm" className="flex-shrink-0 p-1 h-auto">
            <Copy className="size-4 text-custom-text-200 group-hover:text-custom-text-100" />
          </Button>
        </div>
      </div>
      {description && <div className="text-xs text-custom-text-300">{description}</div>}
    </div>
  );
};

type TInstanceDetailsForLicenseActivationProps = {
  workspaceSlug: string;
};

export const InstanceDetailsForLicenseActivation = observer((props: TInstanceDetailsForLicenseActivationProps) => {
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
        <h3 className="text-sm font-semibold text-custom-text-100">{PLANE_PROVIDED_DETAILS.title}</h3>
        <p className="text-xs text-custom-text-300">{PLANE_PROVIDED_DETAILS.description}</p>
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
