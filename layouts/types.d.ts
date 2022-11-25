export type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

export type Props = {
  meta?: Meta;
  children: React.ReactNode;
};
