import { TPublishSettings } from "@plane/types";

export type TPagePublishViewProps = object;

export type TPagePublishSettings = TPublishSettings & {
  view_props: TPagePublishViewProps | undefined;
};
