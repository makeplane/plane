/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// local imports
import { GeneralConfigurationForm } from "./form";
import { DefaultLanguageForm } from "./language-form";
// types
import type { Route } from "./+types/page";

function GeneralPage() {
  const { instance, instanceAdmins, formattedConfig, instanceConfigurations, fetchInstanceConfigurations } =
    useInstance();
  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <PageWrapper
      header={{
        title: "General settings",
        description: "Manage your instance details, default language for new users, and telemetry preferences.",
      }}
    >
      <div className="space-y-8">
        {instance && instanceAdmins && <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />}
        {formattedConfig && (
          <DefaultLanguageForm
            config={formattedConfig}
            readOnly={
              instanceConfigurations?.find((configuration) => configuration.key === "DEFAULT_LANGUAGE")?.is_read_only
            }
          />
        )}
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "General Settings - God Mode" }];

export default observer(GeneralPage);
