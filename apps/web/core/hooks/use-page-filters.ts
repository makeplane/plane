import { useCallback, useMemo } from "react";
// plane editor
import type { TEditorFontSize, TEditorFontStyle } from "@plane/editor";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

export type TPagesPersonalizationConfig = {
  full_width: boolean;
  font_size: TEditorFontSize;
  font_style: TEditorFontStyle;
  sticky_toolbar: boolean;
};

const DEFAULT_PERSONALIZATION_VALUES: TPagesPersonalizationConfig = {
  full_width: false,
  font_size: "large-font",
  font_style: "sans-serif",
  sticky_toolbar: true,
};

export const usePageFilters = () => {
  // local storage
  const { storedValue: pagesConfig, setValue: setPagesConfig } = useLocalStorage<TPagesPersonalizationConfig>(
    "pages_config",
    DEFAULT_PERSONALIZATION_VALUES
  );
  // stored values
  const isFullWidth = useMemo(
    () => (pagesConfig?.full_width === undefined ? DEFAULT_PERSONALIZATION_VALUES.full_width : pagesConfig?.full_width),
    [pagesConfig?.full_width]
  );
  const isStickyToolbarEnabled = useMemo(
    () =>
      pagesConfig?.sticky_toolbar === undefined
        ? DEFAULT_PERSONALIZATION_VALUES.sticky_toolbar
        : pagesConfig?.sticky_toolbar,
    [pagesConfig?.sticky_toolbar]
  );
  const fontSize = useMemo(
    () => pagesConfig?.font_size ?? DEFAULT_PERSONALIZATION_VALUES.font_size,
    [pagesConfig?.font_size]
  );
  const fontStyle = useMemo(
    () => pagesConfig?.font_style ?? DEFAULT_PERSONALIZATION_VALUES.font_style,
    [pagesConfig?.font_style]
  );
  // update action
  const handleUpdateConfig = useCallback(
    (payload: Partial<TPagesPersonalizationConfig>) => {
      setPagesConfig({
        ...(pagesConfig ?? DEFAULT_PERSONALIZATION_VALUES),
        ...payload,
      });
    },
    [pagesConfig, setPagesConfig]
  );
  /**
   * @description action to update full_width value
   * @param {boolean} value
   */
  const handleFullWidth = useCallback(
    (value: boolean) => {
      handleUpdateConfig({
        full_width: value,
      });
    },
    [handleUpdateConfig]
  );
  /**
   * @description action to update font_size value
   * @param {TEditorFontSize} value
   */
  const handleFontSize = useCallback(
    (value: TEditorFontSize) => {
      handleUpdateConfig({
        font_size: value,
      });
    },
    [handleUpdateConfig]
  );
  /**
   * @description action to update font_size value
   * @param {TEditorFontSize} value
   */
  const handleFontStyle = useCallback(
    (value: TEditorFontStyle) => {
      handleUpdateConfig({
        font_style: value,
      });
    },
    [handleUpdateConfig]
  );
  /**
   * @description action to update full_width value
   * @param {boolean} value
   */
  const handleStickyToolbar = useCallback(
    (value: boolean) => {
      handleUpdateConfig({
        sticky_toolbar: value,
      });
    },
    [handleUpdateConfig]
  );

  return {
    fontSize,
    handleFontSize,
    fontStyle,
    handleFontStyle,
    isFullWidth,
    handleFullWidth,
    isStickyToolbarEnabled,
    handleStickyToolbar,
  };
};
