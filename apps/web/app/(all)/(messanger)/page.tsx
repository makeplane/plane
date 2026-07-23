/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageHead } from "@/components/core/page-title";
import { MessengerFrame } from "@/components/messenger/messenger-frame";

export default function MessangerPage() {
  return (
    <>
      <PageHead title="Gizmo Messenger" />
      <MessengerFrame />
    </>
  );
}
