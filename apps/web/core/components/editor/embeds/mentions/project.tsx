/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";

type Props = {
  id: string;
  entityDisplayName?: string | null;
};

export const EditorProjectMention = observer(function EditorProjectMention(props: Props) {
  const { id, entityDisplayName } = props;
  const { workspaceSlug } = useParams();
  const href = workspaceSlug ? `/${workspaceSlug.toString()}/projects/${id}/` : "#";
  const label = entityDisplayName ?? "project";

  return (
    <span className="not-prose inline rounded-sm bg-accent-subtle-active px-1 py-0.5 text-accent-primary no-underline">
      <Link to={href}>@{label}</Link>
    </span>
  );
});
