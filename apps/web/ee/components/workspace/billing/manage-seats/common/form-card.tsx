type TFormCardProps = {
  title: string;
  children: React.ReactNode;
  infoComponent?: React.ReactNode;
};

export const FormCard: React.FC<TFormCardProps> = (props) => {
  const { title, children, infoComponent } = props;

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-custom-text-400">{title}</h4>
      <div className="flex flex-col w-full gap-3 border border-custom-border-200 rounded-md bg-custom-background-90/70 px-4 py-3">
        {children}
      </div>
      {infoComponent}
    </div>
  );
};
