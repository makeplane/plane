"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { MediaLibraryListHeader } from "./header";
import { MediaLibraryProvider } from "./media-library-context";
import { MediaLibraryUploadModal } from "./media-library-upload-modal";

export default function MediaLibraryListLayout({ children }: { children: React.ReactNode }) {
  return (
    <MediaLibraryProvider>
      <AppHeader header={<MediaLibraryListHeader />} />
      <ContentWrapper>
        <MediaLibraryUploadModal />
        {children}
      </ContentWrapper>
    </MediaLibraryProvider>
  );
}
