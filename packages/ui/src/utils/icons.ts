import { LUCIDE_ICONS_LIST } from "..";

/**
 * Returns a random icon name from the LUCIDE_ICONS_LIST array
 */
export const getRandomIconName = (): string =>
  LUCIDE_ICONS_LIST[Math.floor(Math.random() * LUCIDE_ICONS_LIST.length)].name;
