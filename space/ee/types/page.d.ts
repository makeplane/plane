// types
import { TPage } from "@plane/types";

export type TPageResponse = Pick<
  TPage,
  "created_at" | "description_html" | "id" | "logo_props" | "name" | "updated_at"
>;
