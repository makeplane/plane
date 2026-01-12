type Props = {
  control: React.ReactNode;
  description: string;
  title: React.ReactNode;
};

export function SettingsControlItem(props: Props) {
  const { control, description, title } = props;

  return (
    <div className="w-full py-3 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 md:gap-8">
      <div className="flex flex-col gap-1">
        <h4 className="text-body-sm-medium text-primary">{title}</h4>
        <p className="text-caption-md-regular text-secondary">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
