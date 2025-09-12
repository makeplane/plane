// plane imports
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export const DescriptionInputLoader: React.FC<Props> = (props) => {
  const { className } = props;

  return (
    <Loader
      className={cn(
        "min-h-[120px] max-h-64 space-y-2 overflow-hidden rounded-md border border-custom-border-200 p-3 py-2 pt-3",
        className
      )}
    >
      <Loader.Item width="100%" height="26px" />
      <div className="flex items-center gap-2">
        <Loader.Item width="26px" height="26px" />
        <Loader.Item width="400px" height="26px" />
      </div>
      <div className="flex items-center gap-2">
        <Loader.Item width="26px" height="26px" />
        <Loader.Item width="400px" height="26px" />
      </div>
      <Loader.Item width="80%" height="26px" />
      <div className="flex items-center gap-2">
        <Loader.Item width="50%" height="26px" />
      </div>
      <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
        <Loader.Item width="100px" height="26px" />
        <Loader.Item width="50px" height="26px" />
      </div>
    </Loader>
  );
};
