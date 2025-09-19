type TArtifactBlockMiniProps = {
  title: string;
  description: string;
};

const ArtifactBlockMini = (props: TArtifactBlockMiniProps) => {
  const { title, description } = props;
  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-custom-background-90 max-w-[150px] overflow-hidden">
      <div className="flex gap-2 items-center">
        {/* <Briefcase className="size-3" /> */}
        <span className="text-xs text-custom-text-300 truncate">{title}</span>
      </div>
      <div className="text-sm font-medium line-clamp-2">{description}</div>
    </div>
  );
};

export default ArtifactBlockMini;
