/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useOutletContext } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import { TesthubPageBody } from "@/app/testhub/components/page-shell";
import { FormulationRegisteredAssets } from "../components/registered-assets";
import type { TFormulationOutletContext } from "../layout";

function PageObjectsPage() {
  const { t } = useTranslation();
  const ctx = useOutletContext<TFormulationOutletContext>();
  const pageObjects = ctx.testhub?.snapshot?.payload?.components?.page_objects ?? [];

  return (
    <FormulationRegisteredAssets {...ctx}>
      <TesthubPageBody>
        {pageObjects.length ? (
          <div className="overflow-hidden rounded-md border border-subtle">
            {pageObjects.map((row) => (
              <TesthubListRow key={row.path}>
                <span className="truncate text-primary">
                  {row.name}
                  <span className="ml-2 text-tertiary">{row.path}</span>
                </span>
              </TesthubListRow>
            ))}
          </div>
        ) : (
          <EmptyStateCompact assetKey="note" title={t("formulation.empty")} />
        )}
      </TesthubPageBody>
    </FormulationRegisteredAssets>
  );
}

export default observer(PageObjectsPage);
