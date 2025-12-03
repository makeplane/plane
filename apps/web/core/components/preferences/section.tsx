interface SettingsSectionProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

export function PreferencesSection({ title, description, control }: SettingsSectionProps) {
  return (
    <div className="flex w-full justify-between gap-4 sm:gap-16">
      <div className="col-span-12 sm:col-span-6">
        <h4 className="text-base font-medium text-primary">{title}</h4>
        <p className="text-sm text-secondary">{description}</p>
      </div>
      <div className="col-span-12 sm:col-span-6 my-auto">{control}</div>
    </div>
  );
}
