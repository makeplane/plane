/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { FileText, Files } from "lucide-react";
import { useLocation, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const FileLibraryHeader = observer(function FileLibraryHeader() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { pathname } = useLocation();
  const isContracts = pathname.includes("/file-library/contracts");

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={isContracts ? `/${workspaceSlug}/file-library` : undefined}
                  label={t("sidebar.library")}
                  icon={<Files className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            {isContracts && (
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={t("file_library.contracts.title")}
                    icon={<FileText className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
            )}
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
    </Header>
  );
});
