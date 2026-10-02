/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TCopilotEntityType } from "@plane/types";
// hooks
import { useCopilot } from "@/hooks/store/use-copilot";
// services
import { CopilotService } from "@plane/services";
// local imports
import { CopilotPanel } from "./panel";

type Props = {
  workspaceSlug: string;
  projectId: string;
  entityType: TCopilotEntityType;
  entityId: string;
};

export const CopilotRoot = observer(function CopilotRoot(props: Props) {
  const { workspaceSlug, projectId, entityType, entityId } = props;
  const store = useCopilot();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef(new CopilotService());

  // Open (or create) the session for the current entity, load its transcript and open the stream.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    serviceRef.current
      .getOrCreateSession(workspaceSlug, projectId, { entity_type: entityType, entity_id: entityId })
      .then((session) => {
        if (cancelled) return undefined;
        return store.loadSession(workspaceSlug, projectId, session.id).then(() => session);
      })
      .then((session) => {
        if (cancelled || !session) return null;
        // Reconnect the stream only when the transcript shows an in-progress turn.
        if (store.hasRunningTurn) store.openStream(workspaceSlug, projectId, session.id);
        return session;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.error ?? "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      store.closeStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, entityType, entityId]);

  return (
    <CopilotPanel
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      sessionId={store.session?.id}
      loading={loading}
      error={error}
    />
  );
});
