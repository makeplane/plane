import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isLoading: boolean;
  isFullScreen: boolean;
  currentUser: {
    display_name: string;
    avatar: string;
  };
};

export const Loading = observer((props: TProps) => {
  const { isLoading, currentUser } = props;

  return (
    <div className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-full pb-[230px]")}>
      {/* Loading */}
      {isLoading && <MyMessage isLoading={isLoading} currentUser={currentUser} id={""} />}
      {isLoading && <AiMessage isLoading={isLoading} id={""} />}
    </div>
  );
});
