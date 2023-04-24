// layouts
import Container from "layouts/container";

type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

type Props = {
  meta?: Meta;
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

const DefaultLayout: React.FC<Props> = ({ meta, children }) => (
  <Container meta={meta}>
    <div className="h-screen w-full overflow-auto bg-brand-surface-1">
      <>{children}</>
    </div>
  </Container>
);

export default DefaultLayout;
