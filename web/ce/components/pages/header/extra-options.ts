import { TContextMenuItem } from "@plane/ui";

export const PAGE_OPTIONS_DROPDOWN_EXTRA_OPTIONS: (TContextMenuItem & {
  pushAfter?: string;
})[] = [
  {
    key: "move-page",
    title: "Move page",
    action: () => {},
    pushAfter: "make-a-copy",
    shouldRender: false,
  },
];
