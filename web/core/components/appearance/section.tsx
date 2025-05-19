interface SettingsSectionProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

export const PreferencesSection = ({ title, description, control }: SettingsSectionProps) => (
  <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
    <div className="col-span-12 sm:col-span-6">
      <h4 className="text-lg font-semibold text-custom-text-100">{title}</h4>
      <p className="text-sm text-custom-text-200">{description}</p>
    </div>
    <div className="col-span-12 sm:col-span-6">{control}</div>
  </div>
);
