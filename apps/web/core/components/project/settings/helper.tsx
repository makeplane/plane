/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { ChevronRightOutline } from "@makeplane/propel/icons";
import { Badge } from "@makeplane/propel/components/badge";
import { Switch } from "@makeplane/propel/components/switch";
import { joinUrlPath } from "@plane/utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  featureItem: any;
  value: boolean;
  handleSubmit: (featureKey: string, featureProperty: string) => void;
  disabled?: boolean;
};

export function ProjectFeatureToggle(props: Props) {
  const { workspaceSlug, projectId, featureItem, value, handleSubmit, disabled } = props;
  return featureItem?.href ? (
    <Link href={joinUrlPath(workspaceSlug, "settings", "projects", projectId, "features", featureItem?.href)}>
      <div className="flex items-center gap-2">
        <Badge variant={value ? "brand" : "neutral"} size="sm" label={value ? "Enabled" : "Disabled"} />
        <ChevronRightOutline className="h-4 w-4 text-tertiary" />
      </div>
    </Link>
  ) : (
    <Switch
      size="sm"
      checked={value}
      onCheckedChange={() => handleSubmit(featureItem?.key, featureItem?.property)}
      disabled={disabled}
      aria-label="Toggle project feature"
    />
  );
}
