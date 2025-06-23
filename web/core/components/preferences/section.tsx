interface SettingsSectionProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

export const PreferencesSection = ({ title, description, control }: SettingsSectionProps) => (
  <div className="flex w-full justify-between gap-4 sm:gap-16">
    <div className="col-span-12 sm:col-span-6">
      <h4 className="text-base font-medium text-custom-text-100">{title}</h4>
      <p className="text-sm text-custom-text-200">{description}</p>
    </div>
    <div className="col-span-12 sm:col-span-6 my-auto">{control}</div>
  </div>
);
