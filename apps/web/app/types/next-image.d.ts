declare module "next/image" {
  type Props = React.ComponentProps<"img"> & {
    src: string;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    placeholder?: "blur" | "empty";
    blurDataURL?: string;
  };
  const Image: React.FC<Props>;
  export default Image;
}
