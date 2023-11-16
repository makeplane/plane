interface ILabelName {
  name: string;
  color: string;
}

export const LabelName = (props: ILabelName) => {
  const { name, color } = props;

  return (
    <div className="flex items-center gap-3">
      <span
        className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
        style={{
          backgroundColor: color && color !== "" ? color : "#000",
        }}
      />
      <h6 className="text-sm">{name}</h6>
    </div>
  );
};
