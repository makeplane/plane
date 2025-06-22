import { cn } from "@plane/utils";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  subtitle?: string | null;
  actions?: React.ReactNode;
  headerClassName?: string;
};

const AnalyticsSectionWrapper: React.FC<Props> = (props) => {
  const { title, children, className, subtitle, actions, headerClassName } = props;
  return (
    <div className={className}>
      <div className={cn("mb-6 flex items-center gap-2 text-nowrap ", headerClassName)}>
        {title && (
          <div className="flex  items-center gap-2 ">
            <h1 className={"text-lg font-medium"}>{title}</h1>
            {/* {subtitle && <p className="text-lg text-custom-text-300"> • {subtitle}</p>} */}
          </div>
        )}
        {actions}
      </div>
      {children}
    </div>
  );
};

export default AnalyticsSectionWrapper;
