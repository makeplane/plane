type Props = {
  title: string;
  description?: string;
};

export function ProfileSettingContentHeader(props: Props) {
  const { title, description } = props;
  return (
    <div className="flex flex-col gap-1 pb-4 border-b border-custom-border-100 w-full">
      <div className="text-xl font-medium text-custom-text-100">{title}</div>
      {description && <div className="text-sm font-normal text-custom-text-300">{description}</div>}
    </div>
  );
}
