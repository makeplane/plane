type Props = {
  title: string;
  description?: string;
};

export function ProfileSettingContentHeader(props: Props) {
  const { title, description } = props;
  return (
    <div className="flex flex-col gap-1 pb-4 border-b border-subtle w-full">
      <div className="text-xl font-medium text-primary">{title}</div>
      {description && <div className="text-sm font-normal text-tertiary">{description}</div>}
    </div>
  );
}
