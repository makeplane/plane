/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { StickiesInfinite } from "@/components/stickies/layout/stickies-infinite";

export default function WorkspaceStickiesPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHead title={t("stickies.title")} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <StickiesInfinite />
      </div>
    </>
  );
}
