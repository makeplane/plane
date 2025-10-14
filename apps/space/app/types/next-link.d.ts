declare module "next/link" {
  import type { FC, ComponentProps } from "react";

  type NextLinkProps = ComponentProps<"a"> & {
    href: string;
    replace?: boolean;
    prefetch?: boolean;
    scroll?: boolean;
    shallow?: boolean;
  };

  const Link: FC<NextLinkProps>;
  export default Link;
}
