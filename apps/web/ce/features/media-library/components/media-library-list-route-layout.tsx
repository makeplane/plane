"use client";

import { observer } from "mobx-react";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { FiltersRow } from "@/components/rich-filters/filters-row";
import { useMediaLibrary } from "../store/media-library-context";
import { MediaLibraryListHeader } from "./media-library-header";
import { MediaLibraryUploadModal } from "./media-library-upload-modal";

const MediaLibraryFiltersRow = observer(() => {
  const { mediaFilters } = useMediaLibrary();
  return <FiltersRow filter={mediaFilters} />;
});

export const MediaLibraryListRouteLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<MediaLibraryListHeader />} />
    <ContentWrapper>
      <MediaLibraryFiltersRow />
      <MediaLibraryUploadModal />
      {children}
    </ContentWrapper>
  </>
);
