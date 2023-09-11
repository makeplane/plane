export const Label: React.FC<
  React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>
> = (props) => (
  <label className="block text-base font-medium mb-[5px]" {...props}>
    {props.children}
  </label>
);
