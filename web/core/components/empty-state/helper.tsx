export const getEmptyStateImagePath = (category: string, type: string, isLightMode: boolean) =>
  `/empty-state/${category}/${type}-${isLightMode ? "light" : "dark"}.webp`;
