"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatrixCell, MatrixCellSelection, MatrixData } from "../types/matrix.types";
import {
  clearMatrixCellSelection,
  getSelectedMatrixSourceRowIds,
  pruneMatrixCellSelection,
  rangeMatrixCellSelection,
  replaceMatrixCellSelection,
  toggleMatrixCellSelection,
} from "../utils/matrix-selection";

type MatrixSelectionMode = "replace" | "toggle" | "range";

const selectionsMatch = (left: MatrixCellSelection, right: MatrixCellSelection) =>
  left.length === right.length && left.every((cellId, index) => cellId === right[index]);

export const useMatrixSelection = (matrix: MatrixData | null) => {
  const [selection, setSelection] = useState<MatrixCellSelection>(() => clearMatrixCellSelection());
  const validSelection = useMemo(
    () => (matrix ? pruneMatrixCellSelection(selection, matrix) : clearMatrixCellSelection()),
    [matrix, selection]
  );

  useEffect(() => {
    if (!selectionsMatch(selection, validSelection)) setSelection(validSelection);
  }, [selection, validSelection]);

  const selectCell = useCallback(
    (cell: MatrixCell, mode: MatrixSelectionMode = "replace") =>
      setSelection((current) => {
        if (mode === "toggle") return toggleMatrixCellSelection(current, cell);
        if (mode === "range" && matrix) return rangeMatrixCellSelection(current, matrix, cell);
        return replaceMatrixCellSelection(cell);
      }),
    [matrix]
  );
  const clearSelection = useCallback(() => setSelection(clearMatrixCellSelection()), []);
  const selectedCellIds = useMemo(() => new Set(validSelection), [validSelection]);
  const selectedSourceRowIds = useMemo(
    () => (matrix ? getSelectedMatrixSourceRowIds(validSelection, matrix) : []),
    [matrix, validSelection]
  );

  return {
    clearSelection,
    selectedCellIds,
    selectedSourceRowIds,
    selection: validSelection,
    selectCell,
  };
};
