/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Collapsible } from "@makeplane/propel/components/collapsible";
import { ThoughtsOutline } from "@makeplane/propel/icons";
import type { ThoughtItem as TThoughtItem } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";

type Props = {
  item: TThoughtItem;
  /** The agent is still producing this thought. */
  isStreaming: boolean;
};

/** The agent's reasoning, collapsed by default. */
export function ThoughtItem({ item, isStreaming }: Props) {
  const { t } = useTranslation();
  return (
    <Collapsible
      icon={<ThoughtsOutline className="size-4 text-tertiary" />}
      trigger={
        <span className="text-caption-md-regular text-tertiary">
          {isStreaming ? t("agents.transcript.thinking") : t("agents.transcript.thought")}
        </span>
      }
    >
      <p className="border-l-2 border-subtle pl-3 text-caption-md-regular whitespace-pre-wrap text-secondary">
        {item.text}
      </p>
    </Collapsible>
  );
}
