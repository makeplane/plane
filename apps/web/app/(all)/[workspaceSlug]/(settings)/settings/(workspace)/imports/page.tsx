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

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { ImportersList } from "@/components/importers/list";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { ImportsWorkspaceSettingsHeader } from "./header";
// types
import type { Route } from "./+types/page";

function ImportsPage(props: Route.ComponentProps) {
  // router
  const { workspaceSlug } = props.params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  return (
    <SettingsContentWrapper header={<ImportsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full flex flex-col gap-y-6">
        <SettingsHeading title="Imports" />
        <ImportersList workspaceSlug={workspaceSlug} />
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(ImportsPage);
