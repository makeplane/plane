import type { TLogoProps } from "./common";

export type TSticky = {
  created_at?: string | undefined;
  created_by?: string | undefined;
  background_color?: string | null | undefined;
  description?: object | undefined;
  description_html?: string | undefined;
  id: string;
  logo_props: TLogoProps | undefined;
  name?: string;
  sort_order: number | undefined;
  updated_at?: string | undefined;
  updated_by?: string | undefined;
  workspace: string | undefined;
};
