import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  gradient?: boolean;
  className?: string;
};

const DefaultLayout: React.FC<Props> = ({ children, gradient = false, className }) => (
  <div className={cn(`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`, className)}>
    {children}
  </div>
);

export default DefaultLayout;
