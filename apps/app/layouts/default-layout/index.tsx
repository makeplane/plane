type Props = {
  children: React.ReactNode;
  noPadding?: boolean;
  bg?: "primary" | "secondary";
  noHeader?: boolean;
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

const DefaultLayout: React.FC<Props> = ({ children }) => (
  <div className="h-screen w-full overflow-auto bg-custom-background-90">
    <>{children}</>
  </div>
);

export default DefaultLayout;
