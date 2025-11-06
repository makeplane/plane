declare module "next/image" {
  type Props = React.ComponentProps<"img"> & { src: string };
  const Image: React.FC<Props>;
  export default Image;
}
