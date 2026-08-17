/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { TApiSchemaField } from "../../helpers/parse-api-object";

export function SchemaTable({ fields }: { fields: Record<string, TApiSchemaField> }) {
  const { t } = useTranslation();
  const entries = Object.entries(fields);
  if (!entries.length) {
    return <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-subtle">
      <table className="w-full text-left text-13">
        <thead className="border-b border-subtle bg-layer-1 text-tertiary">
          <tr>
            <th className="px-3 py-2 font-medium">{t("testhub.api.name")}</th>
            <th className="px-3 py-2 font-medium">{t("testhub.api.type")}</th>
            <th className="px-3 py-2 font-medium">{t("testhub.api.required")}</th>
            <th className="px-3 py-2 font-medium">{t("testhub.api.note")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, field]) => (
            <tr key={name} className="border-b border-subtle last:border-b-0">
              <td className="px-3 py-2 font-medium text-primary">{name}</td>
              <td className="px-3 py-2 text-secondary">{String(field.type ?? "—")}</td>
              <td className="px-3 py-2 text-secondary">
                {field.required ? t("testhub.api.required") : t("testhub.api.optional")}
              </td>
              <td className="px-3 py-2 text-tertiary">{String(field.note ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
