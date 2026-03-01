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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// constants
import { E_FEATURE_FLAGS } from "@plane/constants";
// helpers
import { cn } from "@plane/utils";
// assets
import integrationsCta1Dark from "@/app/assets/upcoming-features/integrations-cta-1-dark.png?url";
import integrationsCta1Light from "@/app/assets/upcoming-features/integrations-cta-1-light.png?url";
import integrationsCta2Dark from "@/app/assets/upcoming-features/integrations-cta-2-dark.png?url";
import integrationsCta2Light from "@/app/assets/upcoming-features/integrations-cta-2-light.png?url";
// components
import { UpgradeEmptyStateButton } from "@/components/workspace/upgrade-empty-state-button";

export type IntegrationsEmptyStateProps = {
  theme: string;
};

export const IntegrationsEmptyState = observer(function IntegrationsEmptyState(props: IntegrationsEmptyStateProps) {
  const { theme } = props;
  // router
  const { workspaceSlug } = useParams();
  // derived values
  const isDarkMode = theme === "dark";

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl">
      <div
        className={cn("item-center flex min-h-[25rem] justify-between rounded-xl", {
          "bg-gradient-to-l from-[#343434] via-[#484848]  to-[#1E1E1E]": theme === "dark",
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": theme === "light",
        })}
      >
        <div className="relative flex flex-col justify-center gap-7 pl-8 lg:w-1/2">
          <div className="flex max-w-96 flex-col gap-2">
            <h2 className="text-heading-md-semibold">Popular integrations are coming soon!</h2>
            <p className="text-body-sm-medium text-tertiary">
              Send changes in issues to Slack, turn a Support email into a ticket in Plane, and more—coming soon to Pro
              on Plane Cloud and One.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UpgradeEmptyStateButton
              workspaceSlug={workspaceSlug?.toString()}
              flag={E_FEATURE_FLAGS.SILO_INTEGRATIONS}
            />
          </div>
        </div>
        <div className="relative hidden w-1/2 lg:block">
          <span className="absolute bottom-0 right-0">
            <img src={isDarkMode ? integrationsCta1Dark : integrationsCta1Light} height={420} width={420} alt="cta-1" />
          </span>
          <span className="absolute -bottom-16 right-1/2 rounded-xl">
            <img src={isDarkMode ? integrationsCta2Dark : integrationsCta2Light} height={210} width={280} alt="cta-2" />
          </span>
        </div>
      </div>
    </div>
  );
});
