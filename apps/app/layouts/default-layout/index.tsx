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
    <div className="w-full h-screen overflow-auto bg-brand-base">
      <>{children}</>
    </div>
  </Container>
);

export default DefaultLayout;
