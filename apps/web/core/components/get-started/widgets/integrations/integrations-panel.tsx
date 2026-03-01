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

import type { FC } from "react";
import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@plane/propel/button";
import { ExternalLinkIcon } from "@plane/propel/icons";
import { INTEGRATIONS } from "../constant";
import type { TIntegration } from "../constant";

type IntegrationsPanelProps = {
  readonly workspaceSlug: string;
};

export const IntegrationsPanel: FC<IntegrationsPanelProps> = memo(function IntegrationsPanel({ workspaceSlug }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-layer-2 border border-subtle p-4 w-full shadow-raised-100">
      <h4 className="text-h5-semibold">Power up your workspace</h4>
      <div className="flex flex-wrap gap-2">
        {INTEGRATIONS.map((integration: TIntegration) => (
          <Button
            key={integration.title}
            variant="secondary"
            className="rounded-lg"
            onClick={() => router.push(`/${workspaceSlug}/settings/integrations/`)}
            aria-label={`Connect ${integration.title}`}
          >
            <integration.icon className="size-4" aria-hidden="true" />
            <span className="text-sm">Connect {integration.title}</span>
          </Button>
        ))}
      </div>
      <Link href={`/${workspaceSlug}/settings/integrations/`} className="flex items-center gap-2 hover:underline">
        <span className="text-body-sm-medium text-secondary">Browse more integrations</span>
        <ExternalLinkIcon className="size-3" aria-hidden="true" />
      </Link>
    </div>
  );
});
