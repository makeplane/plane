# Cover Images for Work Items

## Overview

Work items now support cover images, similar to Trello cards. When a work item has an attachment with a specific filename, it will be displayed as a cover image at the top of the card in board/kanban view and at the top of the detail view.

## How to Use

1. Open a work item in your project
2. Go to the Attachments section
3. Upload an image with one of the following filenames:
   - `cover-image.jpg`
   - `cover-image.jpeg`
   - `cover-image.png`
   - `cover-image.webp`
   - `cover.jpg`
   - `cover.jpeg`
   - `cover.png`
   - `cover.webp`

4. The cover image will automatically appear:
   - At the top of work item cards in board/kanban view (128px height)
   - At the top of the work item detail/peek overview (240px height)

## Technical Details

### Implementation

The cover image feature consists of four main components:

1. **Hook: `useIssueCoverImage`** (`apps/web/core/hooks/use-issue-cover-image.ts`)
   - Fetches attachments for an issue when `attachment_count > 0`
   - Searches for attachments matching cover image filenames
   - Uses `getFileURL` to construct proper asset URLs
   - Returns the asset URL for the cover image

2. **Component: `KanbanIssueCoverImage`** (`apps/web/core/components/issues/issue-layouts/kanban/cover-image.tsx`)
   - Renders the cover image at the top of kanban cards (128px height)
   - Shows loading state while fetching
   - Handles image load errors gracefully

3. **Component: `IssueDetailCoverImage`** (`apps/web/core/components/issues/issue-detail/cover-image.tsx`)
   - Renders the cover image at the top of work item detail views (240px height)
   - Uses negative margins to extend edge-to-edge
   - Shows loading state while fetching

4. **Integration:**
   - `KanbanIssueBlock` - Integrates cover image into kanban cards
   - `PeekOverviewIssueDetails` - Integrates cover image into detail/peek views

### Styling

- Cover images are displayed with a fixed height of 128px
- Images use `object-cover` to maintain aspect ratio
- The image extends edge-to-edge at the top of the card
- Card uses `overflow-hidden` to clip the image to rounded corners
- Lazy loading is enabled for performance
- Uses inline styles for reliable rendering

### Performance Considerations

- Attachments are only fetched when `attachment_count > 0`
- Images use lazy loading to improve initial page load
- Error handling prevents broken image rendering
- Loading state provides visual feedback during fetch

## Supported File Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## Future Enhancements

Potential improvements for future iterations:

- Allow users to select any attachment as cover image via UI
- Support for drag-and-drop cover image setting
- Image cropping/positioning controls
- Support for more image formats (GIF, SVG)
- Cover image preview in attachment list
- Batch operations to set cover images for multiple work items
