export function FormHeader({ heading, subHeading }: { heading: string; subHeading: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-20 leading-7 font-semibold text-primary">{heading}</span>
      <span className="text-16 leading-7 font-semibold text-placeholder">{subHeading}</span>
    </div>
  );
}
