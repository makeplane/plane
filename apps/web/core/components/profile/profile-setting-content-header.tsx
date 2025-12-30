type Props = {
  title: string;
  description?: string;
};

export function ProfileSettingContentHeader(props: Props) {
  const { title, description } = props;
  return (
    <div className="flex flex-col gap-1 pb-4 border-b border-subtle w-full">
      <div className="text-18 font-medium text-primary">{title}</div>
      {description && <div className="text-13 font-regular text-tertiary">{description}</div>}
    </div>
  );
}
