// asset
const getEmptyStateImagePath = (category: string, prefix: string, mode: string) =>
  `/empty-state/${category}/${prefix}-${mode}.webp`;

export const getEmptyStateImage = (category: string, type: string, isLightMode: boolean) =>
  getEmptyStateImagePath(category, type, isLightMode ? "light" : "dark");
