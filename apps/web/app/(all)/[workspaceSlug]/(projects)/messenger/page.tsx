/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageHead } from "@/components/core/page-title";

function MessengerPage() {
  return (
    <>
      <PageHead title="Мессенджер" />
      <div className="relative h-full w-full overflow-hidden">
        <iframe src="/messenger/" className="h-full w-full border-0" title="Мессенджер" />
      </div>
    </>
  );
}

export default MessengerPage;
