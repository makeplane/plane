export const MATRIX_COLUMN_WIDTH = 72;
export const MATRIX_FIRST_COLUMN_WIDTH = 224;
export const MATRIX_SUMMARY_COLUMNS_WIDTH = MATRIX_COLUMN_WIDTH * 2;
export const MATRIX_COLUMN_OVERSCAN = 3;
export const MATRIX_COLUMN_VIRTUALIZATION_THRESHOLD = 40;

export type MatrixColumnVirtualRange = {
  end: number;
  start: number;
};

type GetMatrixColumnVirtualRangeOptions = {
  columnCount: number;
  scrollLeft: number;
  viewportWidth: number;
  virtualize: boolean;
};

/**
 * Returns an end-exclusive data-column range. Sticky labels and summaries reduce
 * the usable viewport but do not change the table's underlying scroll width.
 */
export const getMatrixColumnVirtualRange = ({
  columnCount,
  scrollLeft,
  viewportWidth,
  virtualize,
}: GetMatrixColumnVirtualRangeOptions): MatrixColumnVirtualRange => {
  if (!virtualize || columnCount <= 0) return { end: columnCount, start: 0 };

  const normalizedScrollLeft = Math.max(0, scrollLeft);
  const dataViewportWidth = Math.max(
    MATRIX_COLUMN_WIDTH,
    viewportWidth - MATRIX_FIRST_COLUMN_WIDTH - MATRIX_SUMMARY_COLUMNS_WIDTH
  );
  const firstVisibleColumn = Math.floor(normalizedScrollLeft / MATRIX_COLUMN_WIDTH);
  const visibleColumnCount = Math.ceil(dataViewportWidth / MATRIX_COLUMN_WIDTH) + 1;
  const start = Math.max(0, Math.min(columnCount - 1, firstVisibleColumn) - MATRIX_COLUMN_OVERSCAN);
  const end = Math.min(
    columnCount,
    Math.max(start + 1, firstVisibleColumn + visibleColumnCount + MATRIX_COLUMN_OVERSCAN)
  );

  return { end, start };
};
