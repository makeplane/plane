/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { DownloadsPanel } from "@/components/file-library/downloads-panel";
// local imports
import { FileLibraryHeader } from "./header";

export default function FileLibraryLayout() {
  return (
    <>
      <AppHeader header={<FileLibraryHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
      {/* Persistent ZIP-export progress (Files + Contracts) */}
      <DownloadsPanel />
    </>
  );
}
