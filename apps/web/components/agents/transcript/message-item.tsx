/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MessageItem as TMessageItem, TranscriptAttachment } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
// components
import { MarkdownRenderer } from "@/components/ui/markdown-to-component";
// local imports
import { keyedByContent } from "../helpers";

function attachmentLabel(attachment: TranscriptAttachment): { label: string; href?: string } {
  switch (attachment.type) {
    case "resource_link":
      return { label: attachment.title ?? attachment.name, href: attachment.uri };
    case "resource":
      return { label: attachment.resource.uri, href: attachment.resource.uri };
    case "image":
      return { label: attachment.mimeType, ...(attachment.uri ? { href: attachment.uri } : {}) };
    default:
      return { label: attachment.type };
  }
}

/** Only http(s) links are rendered as links; anything else (file://, data:) stays text. */
const isWebLink = (href: string | undefined): href is string => !!href && /^https?:\/\//i.test(href);

function AttachmentChip({ attachment }: { attachment: TranscriptAttachment }) {
  const { label, href } = attachmentLabel(attachment);
  return (
    <li className="rounded-sm border border-subtle px-2 py-1 text-caption-md-regular text-secondary">
      {isWebLink(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
          {label}
        </a>
      ) : (
        label
      )}
    </li>
  );
}

type Props = { item: TMessageItem };

export function MessageItem({ item }: Props) {
  const { t } = useTranslation();

  if (item.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg border border-subtle bg-layer-2 px-3 py-2 text-body-sm-regular break-words whitespace-pre-wrap text-primary">
          <span className="sr-only">{t("agents.transcript.you")}: </span>
          {item.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-body-sm-regular break-words text-primary [&_pre]:overflow-x-auto">
      {item.text && <MarkdownRenderer markdown={item.text} />}
      {item.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("agents.transcript.attachment")}>
          {keyedByContent(item.attachments, (attachment) => attachmentLabel(attachment).label).map(
            ({ key, item: attachment }) => (
              <AttachmentChip key={key} attachment={attachment} />
            )
          )}
        </ul>
      )}
    </div>
  );
}
