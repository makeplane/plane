/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LifeBuoy } from "lucide-react";
import { useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";

// Breadcrumb lives in the workspace header (matching Stickies/Time-tracking).
// On an article page it resolves the article title from the store (populated by
// the article view); observer() keeps it reactive to the fetch + locale switch.
export const HelpCenterHeader = observer(function HelpCenterHeader() {
  const { workspaceSlug, articleSlug } = useParams();
  const { t } = useTranslation();
  const { article } = useHelpCenter();

  const ws = workspaceSlug?.toString() ?? "";
  const slug = articleSlug?.toString();
  const detail = slug ? article.getArticleDetailBySlug(slug) : null;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={slug ? `/${ws}/help` : undefined}
                label={t("help_center.breadcrumb_home")}
                icon={<LifeBuoy className="size-4 text-secondary" />}
                isLast={!slug}
              />
            }
          />
          {slug && <Breadcrumbs.Item component={<BreadcrumbLink label={detail?.title ?? slug} isLast />} />}
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
