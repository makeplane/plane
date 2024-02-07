import { useRef } from "react";

const initializeRows = (rows: number) => {
  const initailizedRows: { [id: number]: boolean } = {};
  for (let i = 0; i < rows; ++i) initailizedRows[i] = true;
  return initailizedRows;
};

const getMinMaxIndex = (renderedRows: { [id: number]: boolean }) => {
  const rowIndexes = Object.keys(renderedRows).sort((a: string, b: string) => parseInt(a) - parseInt(b));

  return { min: parseInt(rowIndexes[0]), max: parseInt(rowIndexes[rowIndexes.length - 1]) };
};

export const useVirtualizationHelper = (defaultNumberOfRows: number) => {
  const renderedRows = useRef<{ [id: number]: boolean }>(initializeRows(defaultNumberOfRows));

  const getShouldRender = (index: number) => {
    const { min, max } = getMinMaxIndex(renderedRows.current);
    return min !== undefined && max !== undefined && index !== undefined && index >= min && max >= index;
  };

  const updateRenderTracker = (index: number, isVisble: boolean) => {
    if (isVisble) renderedRows.current[index] = true;
    else if (renderedRows.current[index]) delete renderedRows.current[index];
  };

  return {
    getShouldRender,
    updateRenderTracker,
  };
};
