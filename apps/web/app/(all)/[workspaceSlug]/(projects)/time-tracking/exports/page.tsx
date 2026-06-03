/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { CapacityExportsList } from "@/plane-web/components/time-tracking/capacity/capacity-exports-list";

const WorkspaceExportsPage = observer(function WorkspaceExportsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHead title={t("capacity_exports.title")} />
      <CapacityExportsList />
    </>
  );
});

export default WorkspaceExportsPage;
