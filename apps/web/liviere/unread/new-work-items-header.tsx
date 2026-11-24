/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: header of the "New" work items page, modelled on the drafts header.

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MailOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { useTranslation } from "@plane/i18n";
import { getNumberCount } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CountChip } from "@/components/common/count-chip";
import { useNewWorkItemsCount } from "./use-new-work-items";

export const NewWorkItemsHeader = observer(function NewWorkItemsHeader() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { data: counts } = useNewWorkItemsCount(workspaceSlug?.toString());

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("liviere.unread.title")}
                  icon={<MailOutline className="h-4 w-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
          {!!counts?.total && <CountChip count={getNumberCount(counts.total)} />}
        </div>
      </Header.LeftItem>
    </Header>
  );
});
