"use client";

import { observer } from "mobx-react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { FiltersRow } from "@/components/rich-filters/filters-row";
// local components
import { MediaLibraryListHeader } from "../components/media-library-header";
import { MediaLibraryProvider, useMediaLibrary } from "../state/media-library-context";
import { MediaLibraryUploadModal } from "../components/media-library-upload-modal";

const MediaLibraryFiltersRow = observer(() => {
  const { mediaFilters } = useMediaLibrary();
  return <FiltersRow filter={mediaFilters} />;
});

export default function MediaLibraryListLayout({ children }: { children: React.ReactNode }) {
  return (
    <MediaLibraryProvider>
      <AppHeader header={<MediaLibraryListHeader />} />
      <ContentWrapper>
        <MediaLibraryFiltersRow />
        <MediaLibraryUploadModal />
        {children}
      </ContentWrapper>
    </MediaLibraryProvider>
  );
}
