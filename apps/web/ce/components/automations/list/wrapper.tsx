/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type Props = {
  projectId: string;
  workspaceSlug: string;
  children: React.ReactNode;
};

export function AutomationsListWrapper(props: Props) {
  return <>{props.children}</>;
}
