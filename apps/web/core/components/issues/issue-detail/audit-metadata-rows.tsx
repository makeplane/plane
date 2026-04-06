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

// plane imports
import { EntityDetailAuditInfo } from "@plane/blocks/entity-detail";
import type { AuditRow } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import {
  CompletedAtPropertyIcon,
  CreatedAtPropertyIcon,
  UpdatedAtPropertyIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";
import { renderFormattedDateTime } from "@plane/utils";

type AuditMetadataRowsProps = {
  createdByName?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
};

export function AuditMetadataRows(props: AuditMetadataRowsProps) {
  const { createdByName, createdAt, updatedAt, completedAt } = props;
  const { t } = useTranslation();

  const rows: AuditRow[] = [
    createdByName ? { icon: UserCirclePropertyIcon, text: `${t("common.created_by")} ${createdByName}` } : null,
    createdAt
      ? {
          icon: CreatedAtPropertyIcon,
          text: `${t("common.created_on")} ${renderFormattedDateTime(createdAt, "MMM d, yyyy h:mma")}`,
        }
      : null,
    updatedAt
      ? {
          icon: UpdatedAtPropertyIcon,
          text: `${t("common.updated_on")} ${renderFormattedDateTime(updatedAt, "MMM d, yyyy h:mma")}`,
        }
      : null,
    completedAt
      ? {
          icon: CompletedAtPropertyIcon,
          text: `${t("common.completed_on")} ${renderFormattedDateTime(completedAt, "MMM d, yyyy h:mma")}`,
        }
      : null,
  ].filter(Boolean) as AuditRow[];

  return <EntityDetailAuditInfo rows={rows} />;
}
