interface IFilterPreviewHeader {
  title: string;
}

export const FilterPreviewHeader = ({ title }: IFilterPreviewHeader) => {
  console.log();
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-gray-500 text-xs text-custom-text-300 font-medium">{title}</div>
    </div>
  );
};
