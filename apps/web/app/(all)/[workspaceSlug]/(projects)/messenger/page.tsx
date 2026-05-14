/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { PageHead } from "@/components/core/page-title";

function MessengerPage() {
  return (
    <>
      <PageHead title="Messenger" />
      <div className="relative h-full w-full overflow-hidden">
        <iframe src="/messenger/" className="h-full w-full border-0" title="Messenger" />
      </div>
    </>
  );
}

export default MessengerPage;
