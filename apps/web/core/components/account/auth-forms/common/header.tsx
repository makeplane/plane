export function AuthFormHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-20 font-semibold text-primary">{title}</span>
      <span className="text-20 font-semibold text-placeholder">{description}</span>
    </div>
  );
}
