import { DEFAULT_BACKGROUND_COLORS } from "@plane/constants";

export const getRandomBackgroundColor = () =>
  DEFAULT_BACKGROUND_COLORS[Math.floor(Math.random() * DEFAULT_BACKGROUND_COLORS.length)];
