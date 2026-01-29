/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageNotFound } from "@/components/ui/not-found";
import type { PublishStore } from "@/store/publish/publish.store";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

export function ViewLayoutsRoot(_props: Props) {
  return <PageNotFound />;
}
