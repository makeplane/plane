/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageHead } from "@/components/core/page-title";
import { MessengerFrame } from "./messenger-frame";

function MessengerPage() {
  return (
    <>
      <PageHead title="Gizmo Messenger" />
      <div className="relative h-full w-full overflow-hidden">
        <MessengerFrame />
      </div>
    </>
  );
}

export default MessengerPage;
