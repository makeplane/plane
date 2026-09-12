/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ChatRoot } from "@/components/chat";
import { PageHead } from "@/components/core/page-title";

const WorkspaceChatPage = observer(function WorkspaceChatPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const scope = useMemo(() => ({ workspaceSlug: slug }), [slug]);

  if (!slug) return null;

  return (
    <>
      <PageHead title="Chat" />
      <div className="relative h-full w-full overflow-hidden">
        <ChatRoot scope={scope} />
      </div>
    </>
  );
});

export default WorkspaceChatPage;
