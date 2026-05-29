type Props = {
  control: React.ReactNode;
  description: string;
  title: React.ReactNode;
};

export function SettingsControlItem(props: Props) {
  const { control, description, title } = props;

  return (
    <div className="flex w-full flex-col items-start gap-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8">
      <div className="flex flex-col gap-1">
        <h4 className="text-body-sm-medium text-primary">{title}</h4>
        <p className="text-caption-md-regular text-secondary">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
