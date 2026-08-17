/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Beaker } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { testhubService } from "@plane/services";
import type { TTesthubCatalogResponse } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { testhubErrorMessage } from "../helpers/error-message";
import { pollJobUntilSettled } from "../helpers/poll-job";

type Props = {
  catalog: TTesthubCatalogResponse | null;
  reload: () => Promise<void>;
};

export const TesthubPrimaryHeader = observer(function TesthubPrimaryHeader({ catalog, reload }: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [busy, setBusy] = useState(false);
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  const sync = async () => {
    if (!workspaceSlug || !projectId) return;
    setBusy(true);
    try {
      const job = await testhubService.sync(workspaceSlug, projectId);
      await pollJobUntilSettled(workspaceSlug, projectId, job.id);
      await reload();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("testhub.overview.sync"),
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
                label={t("testhub.title")}
                href={base}
                icon={<Beaker className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {catalog?.repo ? (
        <Header.RightItem>
          <Button variant="primary" size="lg" onClick={sync} loading={busy} disabled={busy}>
            {busy ? t("testhub.overview.syncing") : t("testhub.overview.sync")}
          </Button>
        </Header.RightItem>
      ) : null}
    </Header>
  );
});
