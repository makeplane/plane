export type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

export type Props = {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};
