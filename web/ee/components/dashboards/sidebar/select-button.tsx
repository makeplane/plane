// plane imports
import { cn } from "@plane/utils";

type Props = {
  placeholder: string;
  title: string;
  value: boolean;
};

export const WidgetConfigSelectButton: React.FC<Props> = (props) => {
  const { placeholder, title, value } = props;

  return (
    <div
      className={cn(
        "w-full px-2 py-1 rounded hover:bg-custom-background-80 text-left cursor-pointer transition-colors",
        {
          "text-custom-text-400": !value,
        }
      )}
    >
      {value ? title : placeholder}
    </div>
  );
};
