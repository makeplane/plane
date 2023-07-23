type Props = {
  children: React.ReactNode;
  gradient?: boolean;
};

const DefaultLayout: React.FC<Props> = ({ children, gradient = false }) => (
  <div className={`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`}>
    {children}
  </div>
);

export default DefaultLayout;
