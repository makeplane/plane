import { observer } from "mobx-react";
import { IUser } from "@plane/types";
import { cn } from "@plane/utils";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isLoading: boolean;
  isFullScreen: boolean;
  currentUser: IUser | undefined;
};

export const Loading = observer((props: TProps) => {
  const { isLoading, currentUser } = props;

  return (
    <div className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-full pb-[230px] pt-8")}>
      {/* Loading */}
      {isLoading && <MyMessage isLoading={isLoading} currentUser={currentUser} id={""} />}
      {isLoading && <AiMessage isLoading={isLoading} id={""} />}
    </div>
  );
});
