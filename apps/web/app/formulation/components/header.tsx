/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { BookOpen } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { gitsyncService } from "@plane/services";
import type { TModuleCatalogResponse } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { testhubErrorMessage } from "@/app/testhub/helpers/error-message";

type Props = {
  catalog: TModuleCatalogResponse | null;
  reload: () => Promise<void>;
};

export const FormulationPrimaryHeader = observer(function FormulationPrimaryHeader({ catalog, reload }: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [busy, setBusy] = useState(false);
  const base = `/${workspaceSlug}/projects/${projectId}/formulation`;

  const sync = async () => {
    if (!workspaceSlug || !projectId || !catalog?.remote) return;
    setBusy(true);
    try {
      await gitsyncService.syncRemote(workspaceSlug, projectId, catalog.remote.id);
      await reload();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("formulation.sync"),
        message: testhubErrorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug ?? ""} projectId={projectId ?? ""} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("formulation.title")}
                href={base}
                icon={<BookOpen className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {catalog?.remote ? (
        <Header.RightItem>
          <Button variant="primary" size="lg" onClick={sync} loading={busy} disabled={busy}>
            {busy ? t("formulation.syncing") : t("formulation.sync")}
          </Button>
        </Header.RightItem>
      ) : null}
    </Header>
  );
});
