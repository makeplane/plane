import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

const PiChatListLoader = () => Array.from({ length: 3 }).map((_, index) => (
    <Loader
      key={index}
      className={cn(
        "w-full overflow-hidden py-4 flex-1 flex flex-col items-start gap-1 text-custom-text-200 truncate hover:text-custom-text-200 hover:bg-custom-background-90 pointer"
      )}
    >
      <Loader.Item width="200px" height="21px" />
      <Loader.Item width="100px" height="18px" />
    </Loader>
  ));

export default PiChatListLoader;
