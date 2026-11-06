/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Banner } from "@makeplane/propel/components/banner";
import type { NoticeItem as TNoticeItem } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";

const VARIANTS = { info: "info", warning: "warning", error: "danger" } as const;

type Props = { item: TNoticeItem };

/** Live notices from the bridge or agent (e.g. Plane tools unavailable), and the client's own. */
export function NoticeItem({ item }: Props) {
  const { t } = useTranslation();
  const variant = VARIANTS[item.severity as keyof typeof VARIANTS] ?? "neutral";
  if (item.code === "new_session") {
    return <Banner placement="inline" variant="info" size="sm" title={t("agents.transcript.new_session_notice")} />;
  }
  return (
    <Banner
      placement="inline"
      variant={variant}
      size="sm"
      title={item.title}
      {...(item.description ? { description: item.description } : {})}
    />
  );
}
