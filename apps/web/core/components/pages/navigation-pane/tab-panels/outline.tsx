/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { ScrollArea } from "@plane/propel/scrollarea";
// plane web imports
import { PageNavigationPaneOutlineTabEmptyState } from "@/plane-web/components/pages/navigation-pane/tab-panels/empty-states/outline";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentBrowser } from "../../editor/summary";

type Props = {
  page: TPageInstance;
};

export function PageNavigationPaneOutlineTabPanel(props: Props) {
  const { page } = props;
  // derived values
  const {
    editor: { editorRef },
  } = page;

  return (
    <ScrollArea
      orientation="vertical"
      size="sm"
      scrollType="hover"
      className="size-full overflow-y-auto hide-scrollbar"
      viewportClassName="px-4"
    >
      <PageContentBrowser
        className="mt-0"
        editorRef={editorRef}
        emptyState={<PageNavigationPaneOutlineTabEmptyState />}
      />
    </ScrollArea>
  );
}
