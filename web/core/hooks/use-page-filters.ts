// plane editor
import { TEditorFontSize, TEditorFontStyle } from "@plane/editor";
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
  const isFullWidth = !!pagesConfig?.full_width;
  const fontSize = pagesConfig?.font_size ?? DEFAULT_PERSONALIZATION_VALUES.font_size;
  const fontStyle = pagesConfig?.font_style ?? DEFAULT_PERSONALIZATION_VALUES.font_style;
  const isToolbarSticky = pagesConfig?.sticky_toolbar ?? DEFAULT_PERSONALIZATION_VALUES.sticky_toolbar;
  // update action
  const handleUpdateConfig = (payload: Partial<TPagesPersonalizationConfig>) =>
    setPagesConfig({
      ...(pagesConfig ?? DEFAULT_PERSONALIZATION_VALUES),
      ...payload,
    });
  /**
   * @description action to update full_width value
   * @param {boolean} value
   */
  const handleFullWidth = (value: boolean) =>
    handleUpdateConfig({
      full_width: value,
    });
  /**
   * @description action to update font_size value
   * @param {TEditorFontSize} value
   */
  const handleFontSize = (value: TEditorFontSize) =>
    handleUpdateConfig({
      font_size: value,
    });
  /**
   * @description action to update font_size value
   * @param {TEditorFontSize} value
   */
  const handleFontStyle = (value: TEditorFontStyle) =>
    handleUpdateConfig({
      font_style: value,
    });
  /**
   * @description action to update sticky_toolbar value
   * @param {boolean} value
   */
  const handleStickyToolbar = (value: boolean) =>
    handleUpdateConfig({
      sticky_toolbar: value,
    });

  return {
    fontSize,
    handleFontSize,
    fontStyle,
    handleFontStyle,
    isFullWidth,
    handleFullWidth,
    isToolbarSticky,
    handleStickyToolbar,
  };
};
