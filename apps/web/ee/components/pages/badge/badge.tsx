export const Badge = ({ text, icon }: { text: string; icon?: React.ReactNode }) => (
  <div className="py-0 px-2 text-xs rounded text-custom-text-300 bg-custom-background-80/70 flex items-center gap-1">
    {icon}
    {text}
  </div>
);
