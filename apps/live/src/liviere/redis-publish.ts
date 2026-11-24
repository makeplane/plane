/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: send a Yjs update to the other live instances, using the channel and message
// format of @hocuspocus/extension-redis (each instance applies it if it has the document loaded).

import type { Hocuspocus } from "@hocuspocus/server";
import { OutgoingMessage } from "@hocuspocus/server";
import { Redis } from "@/extensions/redis";

export const publishDocumentUpdate = async (
  hocuspocus: Hocuspocus,
  documentName: string,
  update: Uint8Array
): Promise<number> => {
  const redis = hocuspocus.configuration.extensions.find((extension) => extension instanceof Redis);
  if (!(redis instanceof Redis)) return 0;

  const message = new OutgoingMessage(documentName).createSyncMessage().writeUpdate(update);
  // Same private helpers the extension uses for its own sync messages (see broadcastToDocument)
  const channel = redis["pubKey"](documentName) as string;
  const payload = redis["encodeMessage"](message.toUint8Array()) as Buffer;
  return redis["pub"].publish(channel, payload);
};
