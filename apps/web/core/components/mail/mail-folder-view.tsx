/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";
import { MessageList } from "./message-list";
import { MessageView } from "./message-view";

export const MailFolderView = observer(function MailFolderView() {
  const mail = useMail();
  const navigate = useNavigate();
  const params = useParams();
  const folderKey = params.folderKey || "inbox";
  const uid = params.uid;
  const messages = mail.messagesByFolder[folderKey] ?? [];
  const preferences = mail.preferences;
  const compact = preferences.density === "compact";
  const readingPane =
    preferences.reading_pane === "bottom" || preferences.reading_pane === "none" ? preferences.reading_pane : "right";
  const listLayout = readingPane === "bottom" ? "stacked" : readingPane === "none" && !uid ? "full" : "side";
  const showList = readingPane !== "none" || !uid;
  const showMessage = readingPane !== "none" || !!uid;

  useEffect(() => {
    mail.fetchMessages(folderKey).catch(() => undefined);
  }, [mail, folderKey, preferences.messages_per_page]);

  useEffect(() => {
    let disposed = false;
    let markReadTimer: number | undefined;

    if (uid) {
      void (async () => {
        try {
          const message = await mail.fetchMessage(folderKey, uid);
          if (disposed || message.is_read) return;

          markReadTimer = window.setTimeout(() => {
            mail.setFlags(folderKey, message.uid, { read: true }).catch(() => undefined);
          }, preferences.mark_read_delay_ms);
        } catch {
          // Keep the empty state; the store resets loaders on failure.
        }
      })();
    } else {
      mail.clearSelectedMessage();
    }

    return () => {
      disposed = true;
      if (markReadTimer) window.clearTimeout(markReadTimer);
    };
  }, [mail, folderKey, uid, preferences.mark_read_delay_ms]);

  const selected = uid ? mail.selectedMessage : null;
  const selectedUid = selected?.uid ?? uid;

  return (
    <div className={cn("flex size-full overflow-hidden", readingPane === "bottom" && "flex-col")}>
      {showList && (
        <MessageList
          folderKey={folderKey}
          messages={messages}
          selectedUid={selectedUid}
          loading={mail.loader}
          hasMore={mail.hasMoreMessages(folderKey)}
          loadingMore={mail.loadingMore}
          showSnippets={preferences.show_snippets}
          compact={compact}
          layout={listLayout}
          onLoadMore={() => mail.loadMoreMessages(folderKey)}
          onSearch={(query) => navigate(`/mail/search?q=${encodeURIComponent(query)}`)}
          onToggleStar={(message) => mail.setFlags(folderKey, message.uid, { starred: !message.is_starred })}
        />
      )}
      {showMessage && (
        <MessageView
          folderKey={folderKey}
          message={selected}
          loading={mail.messageLoader}
          onArchive={() => selected && mail.moveMessages(folderKey, "archive", [selected.uid])}
          onDelete={() => selected && mail.deleteMessages(folderKey, [selected.uid], folderKey === "trash")}
          onSpam={() => selected && mail.moveMessages(folderKey, "spam", [selected.uid])}
          onToggleStar={() => selected && mail.setFlags(folderKey, selected.uid, { starred: !selected.is_starred })}
          onReply={() =>
            selected &&
            mail.openCompose({
              to: selected.from.map((address) => address.email),
              subject: selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
            })
          }
          onForward={() =>
            selected &&
            mail.openCompose({
              subject: selected.subject.startsWith("Fwd:") ? selected.subject : `Fwd: ${selected.subject}`,
              body_text: `\n\n${selected.text}`,
              body_html: selected.html,
            })
          }
        />
      )}
    </div>
  );
});
