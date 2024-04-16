import { cn } from "@/helpers/common.helper";

type Props = {
  activeVersionId: string;
};

export const PageEditHistorySidebar: React.FC<Props> = (props) => {
  const {} = props;

  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <button
          key={index}
          type="button"
          className={cn("block w-full py-1 px-3 rounded hover:bg-custom-background-90 text-left", {
            // "bg-custom-background-90": version.id === activeVersionId,
          })}
        >
          <p className="text-sm">{index}. Today at 1:28 PM</p>
          <span className="text-custom-text-400 text-sm">Aaryan Khandelwal</span>
        </button>
      ))}
    </>
  );
};
