declare module "next/link" {
  type Props = React.ComponentProps<"a"> & {
    href: string;
    replace?: boolean;
    prefetch?: boolean;
    scroll?: boolean;
    shallow?: boolean;
  };

  const Link: React.FC<Props>;
  export default Link;
}
